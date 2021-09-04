/**
 * LARGER GOALS/ POTENTIAL FEATURES:
 * 
 * 1. stream game state data from Lichess; track game state and convert SAN to UCI according to user settings
 *  -- COMPLETE ^^^^^
 * 2. Prepare for firefox release; experiment in firefox extension with functional speech grammar
 * -- could probably easily port the extension as is to firefox as a start
 * -- if grammar works, would be fairly easy to set up 1 syllabel letter replacements; maybe even allow certain letters
 * -- can check crx with tool from firefox; however not sure how to extract crx from unpacked extension; maybe wait till pushed this version
 * -- RIP Firefox Dream
 * 
 * 3. Possibly use interim results from recognition to more quickly submit to the API
 * 
 * 4. Home page controls: quick pairing button control!
 * -- need to behave a lot differently from a game page? 
 * -- might initially just use entire body; use gamePage flag to avoid accepting moves
 * -- probably just a homepage.js would be the simplest solution; except voice control stuff
 * 
 * 5. Log speech interpretations up to a certain amount; allows user to go back and see everything that may cause problems
 * -- Up to 100 maybe
 * -- maybe show last 5 in popup
 * 

 * Promotional/supplemental work:
 * 
 * 1. more detailed screenshots on web store page
 * 
 * 2. Video of game fully played with speech
 * 
 * 3. Video of hilarious rage quit command
 * --no one's found it yet :(
 * 
 * 4. Try and poke Eric Rosen and see if he likes it
 * -- Maybe best after SAN gets auto-submitted, but also might just go for it
 * 
 * 5. Reformat Spreadsheet; seperate UCI and SAN example commands
 */

/**
 * Use notes/Pecularities to display to users:
 * 1. SAN format moves may not work correctly from non-standard game modes (crazyhouse, 'from position', etc.)
 * 
 * 2. BISHOPS and Piece Interpretation: The extension recognizes the word 'bishop' and will correctly attempt to create a valid bishop move using the game state. 
 *      It differentiates bishop moves from 'b' pawn moves using a capital 'B'. Replace any word you wish to use to make bishop moves SPECIFICALLY with 'bishop'.
 *      This should really only be a problem if you wish to use a word other than 'bishop', say because the Web Speech API is failing to correctly hear the word
 *      'bishop'.
 * 
 *      With that said: since no other piece has this problem (of sharing their starting letter with a board column letter), the board state will accept lowercase
 *      letters for any piece other than a bishop. For example, if the Speech API incorrectly hears "Rick echo 1" instead of "rook echo 1", the generated move
 *      're1' will be interpreted as a rook move.
 * 
 * 3. If the extension is listening for speech (you have toggled 'listen' on, or are holding ctrl) the moment you switch tabs, it will stop listening. It will not stop listening, however, on switching from Chrome to 
 *      another application
 */

/**
 * NEW TODO: 
 * 
 * 1. SAN format will only work consistently in Standard format matches (crazyhouse, 'from position', etc. formats not supported)
 * -- rewriting README and descriptions might be easiest
 * 
 * 2. extension continues listening when switching application focus
 * -- https://stackoverflow.com/questions/2574204/detect-browser-focus-out-of-focus-via-google-chrome-extension
 * 
 * 3. Additional testing to make sure new changes aren't gonna fuck shit up
 * 
 * 4. Show user message on update to 2.1 letting them know they can use SAN with Automatic Submission
 */

if(isGamePage){

    // Speech Grammar is broken when used in Chromium applications:
    //https://bugs.chromium.org/p/chromium/issues/detail?id=680944
    // var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    // var grammar = '#JSGF V1.0;';
    // var speechRecognitionGrammarList = new SpeechGrammarList();
    // speechRecognitionGrammarList.addFromString(grammar, 1);
    // recognition.grammars = speechRecognitionGrammarList;

    const LISTEN_KEY_CODE = 17;
    const DEFAULT_DISPLAY_MESSAGE = "Dictated move information will appear here.";
    const TOGGLE_LISTEN_MESSAGE = "Press ctrl to toggle dictation on or off";
    const HOLD_LISTEN_MESSAGE = "Hold ctrl to dictate";
    const API_SUBMIT_SUCCESS = "Successfully posted move using Board API";
    const API_SUBMIT_FAIL = "API move submission failed: ";
    const INPUT_BOX_MESSAGE = ' Use Lichess text input box to submit moves with enter key. ---SAN FORMAT WORKS BEST---';
    const CONVERSION_FAIL_MESSAGE = 'Failed to Convert move to UCI for API: '
    const NO_TOKEN_MESSAGE = 
        "No API token! Open options page and set a valid API token to use both UCI format " +
        "and automatic move submission. The text input box may be used to submit with the 'enter' key.";
    

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

    //Maps for catching and handling special commands
    let [specialCommandMap, elementNameMap] = createMaps();
    
    //Speech Recognition
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    let recognition;

    //Text processor
    let processor = new TextProcessor();

    //Initialization
    setupSubmission();
    setupRecognition();

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
            }
            else {
                display_move.innerHTML = "Checking Token...";

                testToken(result['__board_api_token']).then((token)=> {
                    
                    console.log("Valid API token is in use!");
                    setAPIToken(token);
                    display_move.innerHTML = DEFAULT_DISPLAY_MESSAGE;

                    checkIfActiveGame().then((res) =>{
                        
                        const color = res.color.charAt(0);
                        
                        setInitialGameState(color);
                        streamGameData();

                        console.log(`${res.speed} allows API moves, setting up game state streaming...`);
                        console.log(`You are playing the ${res.color} pieces!`);    

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
                        }    
                    });
                }).catch((res) => {
                    setupTextInput();
                    display_move.innerHTML = 'No API Submission; try submitting a new API token.'  + INPUT_BOX_MESSAGE;
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
                else if (item != 'last_command' && item != '__board_api_token') processor.updateReplacementList();
            }
        });    
    };

    function createMaps(){
        commandMap = new Map();
        commandMap.set('new game', findNewGame);
        commandMap.set('rage quit', rageQuit);

        nameMap = new Map();
        nameMap.set('resign', 'fbt resign');
        nameMap.set('offer draw', 'fbt draw-yes');
        nameMap.set('abort', 'fbt abort');
        nameMap.set('accept', 'accept');
        nameMap.set('decline', 'decline');
        nameMap.set('take back', 'fbt takeback-yes');
        nameMap.set('rematch', 'fbt rematch white');
        nameMap.set('flip board', 'fbt flip');
        nameMap.set('analyze game', 'fbt analysis');

        return [commandMap, nameMap];
    }

    //Speech Recognition
    function setupRecognition(){

        recognition =  new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
    
        recognition.onresult = parseSpeech;
    
        recognition.onspeechend = function() {
            recognition.stop();
        };

        recognition.onerror = function(event) {
            console.log('Speech recognition error detected: ' + event.error);
        };
        
        recognition.addEventListener('end', function() {
            if (is_listening == true) recognition.start();
        });
    }

    function parseSpeech(event){

        const speechText = event.results[event.results.length - 1][0].transcript;

        if(speechText == undefined || speechText == null || speechText.length == 0)
            return;

        console.log(`Raw voice input: ${speechText}`);

        let componentWords = processor.processSpeechInput(speechText);
        let result_command = componentWords.join(' ');
        let result_chess_move = '';
        console.log(`Processed voice input: ${result_command}`);

        //store command in last_command, to display in popup window
        chrome.storage.local.set({last_command: result_command});

        //check if spoken command is special command for controlling UI
        if(specialCommandMap.has(result_command))
            specialCommandMap.get(result_command)();

        else if (elementNameMap.has(result_command))
            clickButton(elementNameMap.get(result_command));
        
        //Phrase was not a special command; now attempt to process into a chess move
        else {
            
            result_chess_move = processor.extractChessMove(componentWords);

            if(result_chess_move.length < 2)
                display_move.innerHTML = `Invalid move: ${result_chess_move}`;
            
            //if using API submission
            else if(use_text_input == false){
                
                if(isUCIFormat(result_chess_move) == false)
                    result_chess_move = getUCIFromSAN(result_chess_move);
                
                //if still not UCI Format, display error to user
                if(isUCIFormat(result_chess_move) == false)
                    display_move.innerHTML = CONVERSION_FAIL_MESSAGE + `${result_chess_move} (${result_command}).`;
                
                else apiSubmitMove(result_chess_move);
            }

            //else using text input submission
            else text_input_move = result_chess_move;
        }

        //still sorta fucky
        if(result_chess_move !== '') 
            console.log(`result move: ${result_chess_move}`);

        else console.log(`result command: ${result_command}`);
    }
  
    async function apiSubmitMove(resultMove){

        display_move.innerHTML = "Result Move: " + resultMove + ". submitting with Board API fetch request...";

        postMove(resultMove).then(()=>{
            display_move.innerHTML = `${resultMove}: ` + API_SUBMIT_SUCCESS;
            resetDisplay();
        }).catch((res)=>{
            display_move.innerHTML = API_SUBMIT_FAIL + res.error;
        });
    }
    
    function submitToInputBox(){
        inputBox.value = text_input_move;
        text_input_move = '';
    }
    function isUCIFormat(chessMove){
        //API actually accepts invalid promotion moves and just ignores the promotion. 
        //For example: d2d4q will be interpreted as d2d4.
        //not sure why that's relevant when checking if UCI format or not lel        
        return (chessMove.match(/^[a-h][1-8][a-h][1-8]$/) != null || chessMove.match(/^[a-h][1-8][a-h][1-8][qrbn]$/) != null);
    }

    function waitForPageElements(){
    
        if(!input_found && document.getElementsByClassName('ready').length > 0){
            
            console.log("input box found.");
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

    function setupTextInput(){
        console.log('text input enabled');
        use_text_input = true;
        document.addEventListener('keydown', (e)=>{
            
            if(e.key === 'Enter') submitToInputBox();
        });
    }

    //TODO: this seems to work; visibilitychange event listener removal looks silly when including the function previously added
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

        // let className = ui_element || result_UI_element;
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

            console.log(`clicking ${ui_element} button.`);

            let evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            button.dispatchEvent(evt);
            button.click();

            if (ui_element === 'fbt resign') clickButton('fbt yes');
            if (ui_element === 'fbt draw-yes') clickButton('fbt yes draw-yes');
        }

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
}