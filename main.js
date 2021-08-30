/**
 * LARGER GOALS/ POTENTIAL FEATURES:
 * 
 * 1. stream game state data from Lichess; track game state and convert SAN to UCI according to user settings
 *  -- COMPLETE ^^^^^
 * 2. Prepare for firefox release; experiment in firefox extension with functional speech grammar
 * -- could probably easily port the extension as is to firefox as a start
 * -- if grammar works, would be fairly easy to set up 1 syllabel letter replacements; maybe even allow certain letters
 * -- can check crx with tool from firefox; however not sure how to extract crx from unpacked extension; maybe wait till pushed this version
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
 * ADDITIONS TO DEFAULT REPLACED WORDS OR PHRASES:
 * 
 * 
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
 */

if(isGamePage){
    /**
     * So here we know that the page may contain an active game. We need these variables declared outside of functions for global use.
     * However, we could instantiate them in an async function that waits for the results of the API call; 
     * and if the API call returns negative, then we can save some space and work by not initializing anything else. 
     */
    // console.log("Might be ongoing game, doing the thing");

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
    const API_SUBMIT_SUCCESS = "Successfully submitted move with Lichess API!";
    const API_SUBMIT_FAIL = "Error - API move submission failed: ";
    const INPUT_BOX_MESSAGE = ' Use Lichess text input box to submit moves with enter key. ---SAN FORMAT WORKS BEST---';
    const CONVERSION_FAIL_MESSAGE = 'Unable to interpret valid move given the known board state; check console for more details.'
    const NO_TOKEN_MESSAGE = 
        "No API token! Open options page and set a valid API token to use both UCI format " +
        "and automatic move submission. You can still use SAN format moves, and press enter to submit them.";
    

    //HTML elements. inputBox is created by another script most likely and is not yet created,
    //even when script is run at document_end (in manifest)
    const display_move = document.createElement('strong');
    const display_listen_status = document.createElement('strong');
    let inputBox; 

    //flags and other variables
    let toggle_hold_message = '';
    let result_command = '';
    let result_chess_move = '';
    let result_UI_element = '';
    let holding_listen_key = false;
    let is_listening = false;
    let toggle_listen;
    let use_text_input = false;    

    //element found flags; need to be global for observer
    let input_found = false;
    let underboard_found = false;
    let material_bottom_found = false;

    //function that will be called depending on spoken command/move
    let submit_function;

    //Map for catching and handling special commands
    let specialCommandMap;
    let elementNameMap;
    
    //initializing speech recognition 
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    let recognition;

    //let recognition = setupRecognition();

    //Text processor
    let processor = new TextProcessor();

    //Initialization
    setupSubmission();
    createMaps();
    setupRecognition();

    //document observer; observes DOM until inputBox (and a couple other elements) have been located.
    let observer = new MutationObserver(waitForPageElements);
    observer.observe(document, {subtree: true, childList: true});

    document.addEventListener('keydown', listenKeyDown);
    document.addEventListener('keyup', listenKeyUp);
    document.addEventListener('visibilitychange', function() {
        stopDictation();
        holding_listen_key = false;
    });

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
                        console.log(`You are playing the ${color} pieces!`);    

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
        specialCommandMap = new Map();
        specialCommandMap.set('new game', findNewGame);
        specialCommandMap.set('rage quit', rageQuit);

        elementNameMap = new Map();
        elementNameMap.set('resign', 'fbt resign');
        elementNameMap.set('offer draw', 'fbt draw-yes');
        elementNameMap.set('abort', 'fbt abort');
        elementNameMap.set('accept', 'accept');
        elementNameMap.set('decline', 'decline');
        elementNameMap.set('take back', 'fbt takeback-yes');
        elementNameMap.set('rematch', 'fbt rematch white');
        elementNameMap.set('flip board', 'fbt flip');
        elementNameMap.set('analyze game', 'fbt analysis');
    }

    /**
     * SPEECH RECOGNITION SECTION 
     */
    function setupRecognition(){

        recognition =  new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
    
        recognition.onresult = function(event) {
            parseSpeech(event);

            if(result_command == -1){
                display_move.innerHTML = result_chess_move + ': ' + CONVERSION_FAIL_MESSAGE;
            }

            else if(result_command != undefined && result_command.length != 0){
                
                if(use_text_input == false) submit_function();
            }

            else console.log("No valid command or move was interpreted.");

            result_command = '';
            submit_function = null;
        };
    
        /**
         * TODO: there was something about the listening I wanted to change.
         * 
         * While using toggle listening, for the sake of speed, provide user key to immediately submit a move?
         * In the same vein, provide key to ignore whatever has been heard in the immediate listening sesion?
         * 
         * Implement known single syllable word list for letters - possibly
         * 
         */
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

        console.log("Raw voice input: " + speechText);

        let componentWords = processor.processSpeechInput(speechText);
        result_command = componentWords.join(' ');
        console.log('Processed voice input: ' + result_command);

        //store command in last_command, to display in popup window
        chrome.storage.local.set({last_command: result_command});

        //check if spoken command is special command for controlling UI
        if(specialCommandMap.has(result_command)){
            submit_function = specialCommandMap.get(result_command);
        }

        else if (elementNameMap.has(result_command)){
            submit_function = clickButton;

            //global variable for the UI element. Probably better way to do this
            result_UI_element = elementNameMap.get(result_command);
        }
        //is not a special command; we now process into chess move
        else {
            result_chess_move = processor.extractChessMove(componentWords);

            //if Board API does not support the current game speed, use text input submission
            if(use_text_input == false){

                if(isUCIFormat(result_chess_move)) result_command = result_chess_move;

                else result_command = getUCIFromSAN(result_chess_move);
                
                submit_function = apiSubmitMove;
            }

            else result_command = result_chess_move;
        }

        console.log('result command or move: ' + result_command);
    }
  
    async function apiSubmitMove(){

        display_move.innerHTML = "Result Move: " + result_command + ". submitting with Board API fetch request...";

        postMove(result_command).then(()=>{
            display_move.innerHTML = API_SUBMIT_SUCCESS;
            resetDisplay();
        }).catch((res)=>{
            display_move.innerHTML = API_SUBMIT_FAIL + res.error;
        });
    }
    
    function submitToInputBox(){
        inputBox.value = result_chess_move;
    }
    function isUCIFormat(chessMove){
        //API actually accepts invalid promotion moves and just ignores the promotion. 
        //For example: d2d4q will be interpreted as d2d4.
        //not sure why that's relevant when checking if UCI format or not lel
        return (chessMove.match(/^[a-h][1-8][a-h][1-8]$/) || chessMove.match(/^[a-h][1-8][a-h][1-8][qrbn]$/));
    }

    function waitForPageElements(){
    
        if(!input_found && document.getElementsByClassName('ready').length > 0){
            
            console.log("input found.");
            inputBox = document.getElementsByClassName('ready')[0];            
            input_found = true;
        }
    
        if(!underboard_found && document.getElementsByClassName('round__underboard').length > 0){
            
            console.log("underboard found.");
            let under_board = document.getElementsByClassName('round__underboard')[0];
            under_board.insertBefore(display_move, under_board.firstChild);
            underboard_found = true;
        }
    
        if(!material_bottom_found && (document.getElementsByClassName('material material-bottom').length > 0)){
            
            console.log("material bottom found.");
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

    //TODO: this seems to work; visibilitychange event listener removal looks silly including the function
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
        await new Promise(r => setTimeout(r, 1400));
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

        let className = ui_element || result_UI_element;
        let elements = document.getElementsByClassName(className);
        let button = elements[0];
      
        if(button == null){

            if(className === 'fbt flip active')
                clickButton('fbt flip');
            else {
                console.log(`did not find ${className} button.`);
                return;
            }        
        }
    
        else {

            console.log(`clicking ${className} button.`);

            let evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            button.dispatchEvent(evt);
            button.click();

            if (className === 'fbt resign') clickButton('fbt yes');
            if (className === 'fbt draw-yes') clickButton('fbt yes draw-yes');
        }

        result_UI_element = '';
    }

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