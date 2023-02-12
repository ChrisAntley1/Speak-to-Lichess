import { Chess } from 'chess.js';
import { isGamePage, lichessLocation} from './locationCheck.js';
import TextProcessor from './TextProcessor.js';
import {    testToken,
            setAPIToken,
            postMove, 
            readBoardData,
            checkIfActiveGame,
            streamGameData } from './APIRequests.js';
import SANtoUCI, {setInitialGameState} from './boardState.js';

var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;


//Main extension script. Only runs if *probably* on a game page on Lichess
if(isGamePage){
    const LISTEN_KEY_CODE = 17;
    const _MOVES_DATA_IDENTIFIER = "\"moves\":";
    const REBUILDING_BOARD_STATE = 'updateGameState: either more than 1 new move received, or takeback has occured; building board state from starting position...';

    const DEFAULT_DISPLAY_MESSAGE = "Dictated move information will appear here.";
    const TOGGLE_LISTEN_MESSAGE = "Press ctrl to toggle dictation on or off";
    const HOLD_LISTEN_MESSAGE = "Hold ctrl to dictate";
    const API_SUBMIT_SUCCESS = "Successfully posted move using Board API";
    const API_SUBMIT_FAIL = "API move submission failed: ";
    const INPUT_BOX_MESSAGE = ' Use Lichess text input box to submit SAN moves with enter key.';
    const TEXT_INPUT_READY = 'Press enter to submit ';
    const TEXT_INPUT_DEFAULT_MESSAGE  = 'Waiting for SAN format move';
    const CONVERSION_FAIL_MESSAGE = 'Failed to Convert move to UCI for API: ';
    // const NO_TOKEN_MESSAGE = 
    //     "No API token. Open extension options and set a valid API token to use hands-free move submission. " +
    //     "The text input box may be used to submit with the 'enter' key.";
    
    
    const NO_TOKEN_MESSAGE = 'No API token. Add a token from the options page, or use the Lichess text input box.';
    const FAST_TIME_MESSAGE = 'Dictation available with text input box.';
    //HTML elements. inputBox may not have been created yet; will find using observer
    const display_move = document.createElement('strong');
    const display_listen_status = document.createElement('strong');
    let inputBox; 

    //element found flags
    let input_found = false;
    let underboard_found = false;
    let material_bottom_found = false;
    
    //listening flags and other variables
    let holding_listen_key = false;
    let is_listening = false;
    let toggle_listen;
    let use_text_input = false;    
    let text_input_move = '';

    let sanSloppyCapture = true;
    //Maps for catching and handling special commands
    let [specialCommands, gameCommands] = createCommandMaps();
    
    //Speech Recognition
    let recognition = setupRecognition();
    ;
    //Text processor
    let processor = new TextProcessor();

    //Board tracker and movelist
    let gameBoard = new Chess();
    let moveList = [];

    //Initialization
    setupSubmission();

    //document observer; observes DOM until inputBox (and a couple other elements) have been located.
    let observer = new MutationObserver(waitForPageElements);
    observer.observe(document, {subtree: true, childList: true});

    //key event listeners; 'enter' key listener for text input submission is conditionally added elsewhere with setupTextInput();
    document.addEventListener('keydown', listenKeyDown);
    document.addEventListener('keyup', listenKeyUp);
    document.addEventListener('visibilitychange', function() {
        stopDictation();
        holding_listen_key = false;
    });

    //gets user settings; checks API Token status; checks if current game is active; sets up either API submission or text submission accordingly
    function setupSubmission(){
        chrome.storage.local.get(['__toggle'], function(result){
            toggle_listen = result['__toggle'];
        
            display_listen_status.innerHTML = 
                (toggle_listen) ? TOGGLE_LISTEN_MESSAGE: HOLD_LISTEN_MESSAGE;
        });
    
        chrome.storage.local.get(['__board_api_token'], function(result){
    
            if(!result.hasOwnProperty('__board_api_token')){
                display_move.innerHTML = NO_TOKEN_MESSAGE;
                setupTextInput();
                // resetDisplay();
            }
            else {
                display_move.innerHTML = "Checking Token...";

                testToken(result['__board_api_token']).then((token)=> {
                    
                    console.log("Valid API token is in use!");
                    setAPIToken(token);
                    display_move.innerHTML = DEFAULT_DISPLAY_MESSAGE;

                    checkIfActiveGame().then((res) =>{
                        console.log('active game check results:');
                        console.log(res);
                        // const color = res.color.charAt(0);
                        console.log(`API moves allowed! Setting up game stream and board tracking...`);

                        setupBoardTracking(res);
                        // setInitialGameState(color);

                    }).catch((res) =>{

                        if(res.hasOwnProperty('isActiveGame') && res.isActiveGame == false){

                            cancelExtensionChanges();
                            console.log('API Submission: This does not appear to be an active game.');
                            console.log(res);
                        }

                        else if(res.hasOwnProperty('speed')){

                            setupTextInput();
                            console.log(`API Submission: ${res.speed} does not allow API move submission.`);
                            display_move.innerHTML = `No API Submission; ${res.speed} does not allow API move submission.` + INPUT_BOX_MESSAGE;

                            display_move.innerHTML = `${res.speed}: ` + FAST_TIME_MESSAGE;
                        }    
                    });
                }).catch((res) => {
                    setupTextInput();
                    display_move.innerHTML = 'No API Submission; try submitting a new API token.'  + INPUT_BOX_MESSAGE;
                    display_move.innerHTML = 'Token failed. '  + FAST_TIME_MESSAGE;
                    console.log(`API token fetch failed: ${res['error']}. add new API token in options.`);
                });
            }
        });
    
        //listen for toggle setting change, or any new replacement words
        chrome.storage.onChanged.addListener(function(changes, area) {
        
            let changedItems = Object.keys(changes);
            for (let item of changedItems) {
                
                if(item === '__toggle'){
                    toggle_listen = changes[item].newValue;
                    
                    display_listen_status.innerHTML = 
                        (toggle_listen) ? TOGGLE_LISTEN_MESSAGE: HOLD_LISTEN_MESSAGE;
        
                    is_listening = false;
                    recognition.stop();
                } 
                else if (item != 'last_command' && item != '__board_api_token') processor.setReplacementList();
            }
        });    
    };
    function setupBoardTracking(res){
        gameBoard = new Chess(res.fen);
        console.log(gameBoard.ascii());
        streamGameData(parseBoardData);
    }

    function parseBoardData(value){
        let line = new TextDecoder().decode(value);
        console.log('parsing board data...');
        console.log(line);
        if(line.length > 0 && line.includes(_MOVES_DATA_IDENTIFIER)){
    
            let newMoves = line.substring(line.indexOf(_MOVES_DATA_IDENTIFIER) + _MOVES_DATA_IDENTIFIER.length + 1).split('\"')[0].split(' ');
    
            if(newMoves.toString() !== moveList.toString())
                updateGameState(newMoves);
        }
    }

    function updateGameState(newMoves){
        console.log('updating game state...');
        if(newMoves.length - moveList.length == 1 && isMoveListValid(newMoves) == true){
            const newMove = newMoves[newMoves.length - 1];
            console.log(gameBoard.move(newMove));
            // movePiece(newMove);
            console.log('titties');
        }
        
        //TODO handle takebacks again
        else {
            console.log(REBUILDING_BOARD_STATE);
            console.log('EXCEPT NOT ACTUALLY x.x');
            // setInitialGameState(userColor);
            // for(move of newMoves)
            //     movePiece(move);
        }
    
        moveList = newMoves;
    
        //setting board back to starting position creates issue where moveList ends up with a single move ""
        if(newMoves.length == 1 && newMoves[0] === '')
            moveList = [];    
    }

    function isMoveListValid(newMoves){

        for(let i = moveList.length - 1; i>= 0; i--)
            if(newMoves[i] !== moveList[i]) return false;
        
        return true;
    }
    

    //Speech Recognition
    function setupRecognition(){

        // Speech Grammar is (unfortunately) ignored when used in Chromium applications:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=680944
        // var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
        // var grammar = '#JSGF V1.0;';
        // var speechRecognitionGrammarList = new SpeechGrammarList();
        // speechRecognitionGrammarList.addFromString(grammar, 1);
        // recognition.grammars = speechRecognitionGrammarList;

        let newRec =  new SpeechRecognition();
        console.log(newRec);
        newRec.lang = navigator.language || navigator.userLanguage;
        newRec.interimResults = false;
    
        newRec.onresult = speechHandler;
    
        newRec.onspeechend = function() {
            newRec.stop();
        };

        newRec.onerror = function(event) {
            console.log('Speech Recognition error detected: ' + event.error);
        };
        
        newRec.addEventListener('end', function() { 
            if (is_listening == true) newRec.start();
        });

        console.log('Recognition setup complete...');

        return newRec;
    }

    function speechHandler(event){
        const speechText = event.results[event.results.length - 1][0].transcript;

        if(speechText == undefined || speechText == null || speechText.length == 0)
            return;
        
        //store command in last_command, to display in popup window
        chrome.storage.local.set({last_command: speechText});

        let result = processor.parseSpeechText(speechText);
        let phrase = result.phrase;
        let components = result.components;
        let chessMove = result.move;

        console.log(`Raw voice input: ${speechText}`);
        console.log(`Processed: ${phrase}`);

        //check if spoken command is special command for controlling UI
        if(specialCommands.has(phrase))
            specialCommands.get(phrase)();
            
        //check if spoken command is special command for controlling UI
        else if (gameCommands.has(phrase))
            clickButton(gameCommands.get(phrase));
        
        //check and process the chess move that the TextProcessor created
        else {
            //TODO this is weird. guess it's more efficient tho
            if(chessMove.length < 2)
                display_move.innerHTML = `Invalid move: ${chessMove}`;
            
            //if using API submission
            else if(use_text_input == false){
                
                let moveResult = movePiece(chessMove);
                if (moveResult == null) moveResult = sloppyMovePiece(chessMove);

                if(moveResult == null){
                    display_move.innerHTML = CONVERSION_FAIL_MESSAGE + `${chessMove} (${phrase}).`;
                }

                else {
                    gameBoard.undo();
                    apiSubmitMove(moveResult.lan);
                }
                // if(isUCIFormat(chessMove) == false)
                //     chessMove = SANtoUCI(chessMove);
                
                // if(isUCIFormat(chessMove) == false)
                
                // else apiSubmitMove(chessMove);
            }

            //else using text input submission. Just place move in textBox regardless of validity; user will see (hopefully)
            else {
                text_input_move = chessMove;
                display_move.innerHTML = TEXT_INPUT_READY + text_input_move;
            }

        }
    }
    function movePiece(move) {
        // Here we submit the move JUST to get the UCI interpretation from our gameBoard.
        // We immediately revert it and rely on updates from the Lichess Board API to make
        // permanent updates to the gameBoard. 
        let result = null;
        try {
            result = gameBoard.move(move, { strict: false });
        }

        catch(err) {
            console.log(err);
        }
        return result;
    }

    function sloppyMovePiece(move){
        let legalMoves = gameBoard.moves();
        for (let i = 0; i < legalMoves.length; i++){
            if(move === legalMoves[i].replace('x',''))
                return gameBoard.move(legalMoves[i]);
        }
        return null;
    }
    async function apiSubmitMove(move){

        display_move.innerHTML = "Result Move: " + move + ". submitting with Board API fetch request...";

        postMove(move).then(()=>{
            display_move.innerHTML = `${move}: ` + API_SUBMIT_SUCCESS;
            resetDisplay();
        }).catch((res)=>{
            display_move.innerHTML = API_SUBMIT_FAIL + res.error;
        });
    }
    
    function isUCIFormat(chessMove){

        //API actually accepts invalid promotion moves and just ignores the promotion. 
        //For example: d2d4q will be interpreted as d2d4.
        return (chessMove.match(/^[a-h][1-8][a-h][1-8]$/) != null || chessMove.match(/^[a-h][1-8][a-h][1-8][qrbn]$/) != null);
    }

    function setupTextInput(){
        console.log('text input enabled');
        use_text_input = true;
        document.addEventListener('keydown', (e)=>{
            
            if(e.key === 'Enter') submitToInputBox();
        });
    }

    function submitToInputBox(){
        inputBox.value = text_input_move;
        text_input_move = '';
        display_move.innerHTML = TEXT_INPUT_DEFAULT_MESSAGE;
    }

    function waitForPageElements(){
    
        if(!input_found && document.getElementsByClassName('ready').length > 0){
            
            console.log("input box found...");
            inputBox = document.getElementsByClassName('ready')[0];            
            input_found = true;
        }
    
        if(!underboard_found && document.getElementsByClassName('round__underboard').length > 0){
            
            let under_board = document.getElementsByClassName('round__underboard')[0];
            under_board.insertBefore(display_move, under_board.firstChild);
            underboard_found = true;
        }
    
        if(!material_bottom_found && (document.getElementsByClassName('material material-bottom').length > 0)){
            
            let bottom = document.getElementsByClassName('material material-bottom')[0];
            let bottomParent = bottom.parentNode;
            let newDiv = document.createElement('div');
            let height = '60px';
    
            newDiv.className = 'material material-bottom';
            newDiv.style.paddingTop = height;
            newDiv.appendChild(display_listen_status);
            bottomParent.insertBefore(newDiv, bottom.nextSibling);
            material_bottom_found = true;
            }

        if(input_found && underboard_found && material_bottom_found) 
            observer.disconnect();
    }

    //looks ridiculous to include the entire previously added function when removing the visiblitychange event listener
    //but seems to work ¯\_(ツ)_/¯
    function cancelExtensionChanges(){
        display_listen_status.remove();
        display_move.remove();
        document.removeEventListener('keydown', listenKeyDown);
        document.removeEventListener('keyup', listenKeyUp);
        document.removeEventListener('visibilitychange', function() {
            stopDictation();
            holding_listen_key = false;
        });
    }
    
    async function resetDisplay(){
        await new Promise(r => setTimeout(r, 3400));
        display_move.innerHTML = DEFAULT_DISPLAY_MESSAGE;
    }
    function listenKeyDown(e){
    
        if(e.keyCode == LISTEN_KEY_CODE && !holding_listen_key){
            if(toggle_listen)
                is_listening ? stopDictation(): startDictation();
    
            else startDictation();

            if(!holding_listen_key) holding_listen_key = true;
        }
    }
    
    function listenKeyUp(e){
    
        if(e.keyCode == LISTEN_KEY_CODE && holding_listen_key){
            holding_listen_key = false;
    
            //if hold to listen
            if(toggle_listen == false) stopDictation();
        }
    }
    
    function startDictation(){
        
        recognition.start();
        display_listen_status.innerHTML = "Listening...";
        is_listening = true;
    }
    
    function stopDictation(){
       
        recognition.stop();
        display_listen_status.innerHTML = 
            (toggle_listen) ? TOGGLE_LISTEN_MESSAGE: HOLD_LISTEN_MESSAGE;
        
        is_listening = false;
    }
    
    function clickButton(ui_element){

        let elements = document.getElementsByClassName(ui_element);
        let button = elements[0];
      
        if(button == null){

            if(ui_element === 'fbt flip active')
                clickButton('fbt flip');
            else {
                console.log(`did not find ${ui_element} button.`);
                return;
            }        
        }
    
        else {
            let evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            button.dispatchEvent(evt);
            button.click();

            if (ui_element === 'fbt resign') clickButton('fbt yes');
            if (ui_element === 'fbt draw-yes') clickButton('fbt yes draw-yes');
        }
        //TODO this don't exist lol
        result_UI_element = '';
    }

    //TODO: against computer, currently just opens home page to the Lobby section
    function findNewGame(){
    
        let newGameUrl = "https://lichess.org/?hook_like=" + lichessLocation;
        window.open(newGameUrl);
    }
    
    async function rageQuit(){
    
        let pieceList = document.getElementsByTagName('piece');
    
        for(piece of pieceList)
            throwPiece(piece, getRandomArbitrary(10, 250));
        
        await new Promise(r => setTimeout(r, 500));
        clickButton('fbt resign');
        clickButton('fbt abort');
    }
    
    async function throwPiece(piece, endPosition){
        
        let id = null;
        let pos = 0;
        clearInterval(id);
        id = setInterval(frame, 4);
        function frame() {
            if (pos >= endPosition) 
                clearInterval(id); 

            else {
                pos+=2; 
                piece.style.top = "-" +pos + "px"; 
            }
        }
    }
    
    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function createCommandMaps(){
        let specialCommands = new Map();
        specialCommands.set('new game', findNewGame);
        specialCommands.set('rage quit', rageQuit);

        let gameCommands = new Map();
        gameCommands.set('resign', 'fbt resign');
        gameCommands.set('offer draw', 'fbt draw-yes');
        gameCommands.set('abort', 'fbt abort');
        gameCommands.set('accept', 'accept');
        gameCommands.set('decline', 'decline');
        gameCommands.set('take back', 'fbt takeback-yes');
        gameCommands.set('rematch', 'fbt rematch white');
        gameCommands.set('flip board', 'fbt flip');
        gameCommands.set('analyze game', 'fbt analysis');

        return [specialCommands, gameCommands];
    }

}
