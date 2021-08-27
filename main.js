/**
 * LARGER GOALS/ POTENTIAL FEATURES:
 * 
 * 1. stream game state data from Lichess; track game state and convert SAN to UCI according to user settings
 *  -- COMPLETE ^^^^^
 * 2. Prepare for firefox release; experiment in firefox extension with functional speech grammar
 * -- could probably easily port the extension as is to firefox as a start
 * -- if grammar works, would be fairly easy to set up 1 syllabel letter replacements; maybe even allow certain letters
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
 * ADDITIONS TO DEFAULT REPLACED WORDS OR PHRASES:
 * 
 * 
 */

/**
 * NEW TODO: 
 * 
 * 1. BIG: try and capture current users' word replacement lists so that they are not lost with correct word_replacement_list retrieval
 * --Complete. TODO: copy over from test extension!
 * 
 * 2. Flip board button not being found in UI 
 * -- complete. turns out it switches between 'fbt flip' and 'fbt flip active'
 * --fixed: flipboard seemed to want a dispatch event instead of click(). dispatch event
 * --didn't work for other elements. Just calling both; doesn't seem problematic
 * 
 * 3. clean up logs, place more helpful logs to know what goes on/what's getting called
 * --partially complete
 * 
 * 4. seems like the boards API is successfully sending an update on takebacks; can probably handle properly now
 * --complete!
 * 
 * 5. place popup input elements in a form. Also focus the replacement word text box
 * --complete
 * 
 * 6. Figure out how we're going to handle optional text input box usage
 * 
 * 7. Figure out promises and move UI updates back to main
 * --nani the fuck
 * --complete! needed to create and return the promise at top function level it seems
 * 
 * 8. SAN format will only work consistently in Standard format matches (crazyhouse, 'from position', etc. formats not supported)
 * -- rewriting README and descriptions might be easiest
 * 
 * 9. Inform users that replacement words list may need to be updated
 * --programmatic solution? might be a little messy/might not be pretty
 * --TODO: NEED TO COPY OVER! oninstall details tells if the install is an update, and what the previous version was.
 * --Used this to update storage from 2.0's format.
 * 
 * 10. extension continues listening when switching application focus
 * -- https://stackoverflow.com/questions/2574204/detect-browser-focus-out-of-focus-via-google-chrome-extension
 * 
 * 11. add delay to ragequit before issuing quit/abort
 * --did i try this before?
 * --complete! definitely better feel/pace
 * 
 * 12. STILL: Make 'listen' message view not compete for space with material icons
 * --lol fack
 * --slight progress made: creating a div of the same class gets it in technically the correct place; can't seem to make it move down below the original div
 * --complete! though with hardcoded height adjustment
 * 
 */

if(isGamePage){
    /**
     * So here we know that the page may contain an active game. We need these variables declared outside of functions for global use.
     * However, we could instantiate them in an async function that waits for the results of the API call; 
     * and if the API call returns negative, then we can save some space and work by not initializing anything else. 
     */
    // console.log("Might be ongoing game, doing the thing");

    // Grammar = broken
    // var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
    // var grammar = '#JSGF V1.0;';
    // var speechRecognitionGrammarList = new SpeechGrammarList();
    // speechRecognitionGrammarList.addFromString(grammar, 1);
    // recognition.grammars = speechRecognitionGrammarList;

    //Constants (declared as var for scope; probably some noob shit)
    var LISTEN_KEY_CODE = 17;
    var DEFAULT_DISPLAY_MESSAGE = "Your move will appear here.";
    var TOGGLE_LISTEN_MESSAGE = "Press ctrl to toggle dictation on or off";
    var HOLD_LISTEN_MESSAGE = "Hold ctrl to dictate";
    var API_ADDRESS_TEMPLATE = "https://lichess.org/api/board/game/--GAME_ID--/move/--UCI_MOVE--".replace('--GAME_ID--', lichessLocation);
    var BOARD_API_TOKEN = '';
    var NO_TOKEN_MESSAGE = 
        "No API token! Open options page and set a valid API token to use both UCI format " +
        "and automatic move submission. You can still use SAN format moves, and press enter to submit them.";
    
    var API_SUBMIT_SUCCESS = "Successfully submitted move with Lichess API!";
    var API_SUBMIT_FAIL = "Error - API move submission failed: ";
    
    //HTML elements. inputBox is created by another script most likely and is not yet created,
    //even when script is run at document_end (in manifest)
    var display_move = document.createElement('strong');
    var display_listen_status = document.createElement('strong');
    var inputBox; 

    //flags and other variables
    var toggle_hold_message = '';
    var result_command = '';
    var result_chess_move = '';
    var result_UI_element = '';
    var holding_listen_key = false;
    var is_listening = false;
    var toggle_listen;
    var legalGameSpeed = false;
    
    //element found flags; need to be global for observer
    var input_found = false;
    var underboard_found = false;
    var material_bottom_found = false;

    //function that will be called depending on spoken command/move
    var submit_function;

    //Map for catching and handling special commands
    var specialCommandMap;
    var elementNameMap;
    
    //initializing speech recognition 
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var recognition;
    //var recognition = setupRecognition();

    //Text processor
    var processor = new TextProcessor();

    accessChromeStorage();
    createMaps();
    setupRecognition();

    //document observer; observes DOM until inputBox (and a couple other elements) have been located.
    var observer = new MutationObserver(waitForInputBox);
    observer.observe(document, {subtree: true, childList: true});


    //TEXT INPUT FUNCTION
    // document.addEventListener('keydown', enterMove);

    document.addEventListener('keydown', listenKeyDown);
    document.addEventListener('keyup', listenKeyUp);
    document.addEventListener('visibilitychange', function() {
        stopDictation();
        holding_listen_key = false;
    });

    function accessChromeStorage(){
        chrome.storage.local.get(['__toggle'], function(result){
            toggle_listen = result['__toggle'];
        
            display_listen_status.innerHTML = 
                (toggle_listen) ? TOGGLE_LISTEN_MESSAGE: HOLD_LISTEN_MESSAGE;
        });
    
        chrome.storage.local.get(['__board_api_token'], function(result){
    
            if(!result.hasOwnProperty('__board_api_token')){
                display_move.innerHTML = NO_TOKEN_MESSAGE;
            }
            else {
                display_move.innerHTML = "Checking Token...";

                testToken(result['__board_api_token']).then(function(token) {
                    
                    console.log("Valid API token is in use!");
                    BOARD_API_TOKEN = token;
                    display_move.innerHTML = DEFAULT_DISPLAY_MESSAGE;
                    checkIfActiveGame();
                }).catch((res) => {
                    display_move.innerHTML = "API token fetch failed: " + res['error']
                    + ". add new API token in options. User can still use SAN format submissions through the input text box.";

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

            if(result_command != undefined && result_command.length != 0){
                
                submit_function();
                result_command = '';            
            }
            else console.log("No move was stored.");
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
            console.log("recognition speech end");
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

            //TODO: global variable for the UI element. Find way to do this without global variable?
            result_UI_element = elementNameMap.get(result_command);
        }
        //is not a special command; we now process into chess move
        else {
            result_chess_move = processor.extractChessMove(componentWords);

            //if Board API does not support the current game speed, use text input submission
            if(legalGameSpeed == false){

                //populate text input box, do other things
            }
            else if(isUCIFormat(result_chess_move))
                result_command = result_chess_move;
            
            else result_command = getUCIFromSAN(result_chess_move);

            submit_function = submitMove;
        }
        console.log('result command or move: ' + result_command);
    }
  
    async function submitMove(){

        display_move.innerHTML = "Result Move: " + result_command + ". submitting with Board API fetch request...";

        postMove(result_command).then(()=>{
                display_move.innerHTML = API_SUBMIT_SUCCESS;
                resetDisplay();
            }).catch((res)=>{
                display_move.innerHTML = API_SUBMIT_FAIL + res.error;
            });
        
        // .then(res => {
            
        //     console.log(res);
        //     //TODO: see if this works
        //     if(res['ok']){
        //         display_move.innerHTML = API_SUBMIT_SUCCESS;
                
        //     }

        //     else {
        //         display_move.innerHTML = API_SUBMIT_FAIL;
        //     }
        // });
    }
        
    function isUCIFormat(chessMove){
        //API actually accepts invalid promotion moves and just ignores the promotion. 
        //For example: d2d4q will be interpreted as d2d4.
        return (chessMove.match(/^[a-h][1-8][a-h][1-8]$/) || chessMove.match(/^[a-h][1-8][a-h][1-8][qrbn]$/));
    }

    function waitForInputBox(){
    
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

    //TEXT INPUT FUNCTION
    // function enterMove(e){
    
    //     if(e.keyCode == 13){
    //         submitMove();
    //     }
    // }
    
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