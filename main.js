
//Main extension script. Only runs if *probably* on a game page on Lichess

if(isGamePage){

    const LISTEN_KEY_CODE = 17;
    const DEFAULT_DISPLAY_MESSAGE = "Dictated move information will appear here.";
    const TOGGLE_LISTEN_MESSAGE = "Press ctrl to toggle dictation on or off";
    const HOLD_LISTEN_MESSAGE = "Hold ctrl to dictate";
    const API_SUBMIT_SUCCESS = "Successfully posted move using Board API";
    const API_SUBMIT_FAIL = "API move submission failed: ";
    const INPUT_BOX_MESSAGE = ' Use Lichess text input box to submit SAN moves with enter key.';
    const TEXT_INPUT_READY = 'Press enter to submit ';
    const TEXT_INPUT_DEFAULT_MESSAGE  = 'Waiting for SAN format move';
    const CONVERSION_FAIL_MESSAGE = 'Failed to Convert move to UCI for API: '
    // const NO_TOKEN_MESSAGE = 
    //     "No API token. Open extension options and set a valid API token to use hands-free move submission. " +
    //     "The text input box may be used to submit with the 'enter' key.";
    
    const NO_TOKEN_MESSAGE = 'No API token. Add a token from the options page, or use the Lichess text input box.'
    const FAST_TIME_MESSAGE = 'Dictation available with text input box.'
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
                // resetDisplay();
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

        // Speech Grammar is (unfortunately) ignored when used in Chromium applications:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=680944
        // var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
        // var grammar = '#JSGF V1.0;';
        // var speechRecognitionGrammarList = new SpeechGrammarList();
        // speechRecognitionGrammarList.addFromString(grammar, 1);
        // recognition.grammars = speechRecognitionGrammarList;

        recognition =  new SpeechRecognition();
        recognition.lang = navigator.language || navigator.userLanguage;
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
        console.log(`Processed: ${result_command}`);

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
            else {
                text_input_move = result_chess_move;
                display_move.innerHTML = TEXT_INPUT_READY + text_input_move;
            }
        }
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
