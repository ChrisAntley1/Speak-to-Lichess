/**
 * TODO: General TODO for this trip that I can think of currently:
 *  * 
 * 2. properly seperate replacement word list from settings in chrome storage
 * 
 * 4. clean up speech processing
 * 
 * 5. Make 'listen' message view not compete for space with material icons
 * 
 * 6. Get gud at JS and scope functions and variables more appropriately
 * -- Semi Complete. never even tried just putting functions within if statement; forgot javascript dgaf! 
 * -- should now go over scope of variables again
 * 
 * 7. Home page controls: quick pairing button control!
 * -- need to behave a lot differently from a game page? 
 * -- might initially just use entire body; use gamePage flag to avoid accepting moves
 * -- probably just a homepage.js would be the simplest solution; except voice control stuff
 * 
 * 8. Log speech interpretations up to a certain amount; allows user to go back and see everything that may cause problems
 * -- Up to 100 maybe
 * -- maybe show last 5 in popup
 * 
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
 * flipboard -> flip board
 * clipboard -> flip board ?
 * 
 */

/**
 * NEW TODO: 
 * 
 * 1. Consolidate todo lists -.-
 * 
 * 2. Flip board button not being found in UI 
 * 
 * 3. clean up logs, place more helpful logs to know what goes on/what's getting called
 * 
 * 4. seems like the boards API is successfully sending an update on takebacks; can probably handle properly now
 * 
 * 5. place popup input elements in a form. Also focus the replacement word text box
 * 
 * 6. Figure out how we're going to handle optional text input box usage
 * 
 * 
 */

if(checkIfGamePage(lichessLocation)){

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

    //initializing speech recognition 
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    

    //Constants (declared as var for scope)
    var LISTEN_KEY_CODE = 17;
    var DISPLAY_MESSAGE = "Your move will appear here.";
    var API_ADDRESS_TEMPLATE = "https://lichess.org/api/board/game/--GAME_ID--/move/--UCI_MOVE--".replace('--GAME_ID--', lichessLocation);
    var BOARD_API_TOKEN = '';
    var NO_TOKEN_MESSAGE = 
        "No API token! Open options page and set a valid API token to use both UCI format " +
        "and automatic move submission. You can still use SAN format moves, and press enter to submit them.";
    
    var API_SUBMIT_SUCCESS = "Successfully submitted move with Lichess API!";
    var API_SUBMIT_FAIL = "Error - API move submission failed...";
    
    //Map for catching and handling special commands
    var specialCommandMap;
    var elementNameMap;
    //creating our key word maps
    createMaps();

    //HTML elements. inputBox is created by another script most likely and is not yet created,
    //even when script is run at document_end (in manifest)
    var display_move = document.createElement('strong');
    display_move.innerHTML = DISPLAY_MESSAGE;

    var display_listen_status = document.createElement('strong');
    var inputBox; 

    //flags and other variables
    var toggle_hold_message = '';
    var result_command = '';
    var result_chess_move = '';
    var result_UI_element = '';

    var holding_listen_key = false;
    var input_found = false;
    var underboard_found = false;
    var material_bottom_found = false;
    var is_listening = false;



    var processor = new TextProcessor();

    processor.setReplacementList();


    //gets the current game info, starts streaming events, sets initial board state
    //function that will be called depending on spoken command/move
    var submit_function;

    //document observer; observes DOM until inputBox (and a couple other elements) have been located.
    var observer = new MutationObserver(waitForInputBox);
    observer.observe(document, {subtree: true, childList: true});

    recognition.addEventListener('end', function() {
        if (is_listening == true) recognition.start();
    });

    var toggle_hold_selection;

    // var word_replacement_list;

    // //TODO: background page still has this named as fuzzy_words_list, should change to see about retrieving just this list and not everything stored
    // chrome.storage.local.get(word_replacement_list, function(result){
    //     word_replacement_list = result;
    // });

    chrome.storage.local.get(toggle_hold_selection, function(result){

        toggle_hold_selection = result;
        if(toggle_hold_selection['__toggle']) toggle_hold_message = "Press ctrl to toggle on/off dictation";
        else toggle_hold_message = "Press and hold ctrl to dictate";

        display_listen_status.innerHTML = toggle_hold_message;
    });

    chrome.storage.local.get(['__board_api_token'], function(result){

        if(!result.hasOwnProperty('__board_api_token')){
            display_move.innerHTML = NO_TOKEN_MESSAGE;
        }
    
        else {
            testToken(result['__board_api_token']);
        }
    });

    //listen for toggle setting change, or any new replacement words
    chrome.storage.onChanged.addListener(function(changes, area) {
    
        let changedItems = Object.keys(changes);
        for (let item of changedItems) {
            
            if(item === '__toggle'){
                toggle_hold_selection[item] = changes[item].newValue;
                
                if(toggle_hold_selection['__toggle']) toggle_hold_message = "Press ctrl to toggle on/off dictation";
                else toggle_hold_message = "Press and hold ctrl to dictate";
                display_listen_status.innerHTML = toggle_hold_message;

                is_listening = false;
                recognition.stop();
            } 
            else if (item != 'last_command' && item != '__board_api_token') processor.updateReplacementList();
        }
    });

    //TEXT INPUT FUNCTION
    // document.addEventListener('keydown', enterMove);
    document.addEventListener('keydown', listenKeyDown);
    document.addEventListener('keyup', listenKeyUp);
    document.addEventListener('visibilitychange', function() {
        stopDictation();
        holding_listen_key = false;
    });

    /**
     * SPEECH RECOGNITION SECTION 
     */
    recognition.onresult = function(event) {

        parseSpeech(event);

        if(result_command != undefined && result_command.length != 0){
            
            submit_function();
            result_command = '';
            display_move.innerHTML = DISPLAY_MESSAGE;
        
        }
        else console.log("no move was stored.");
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
        //need to change this so we don't have to call some of this code twice
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

            if(isUCIFormat(result_chess_move))
                result_command = result_chess_move;
            
            else {

                result_command = getUCIFromSAN(result_chess_move);
            }

            submit_function = submitMove;
        }

        console.log('result command or move: ' + result_command);

        return;

        // result_command = createChessMove(processedText);

        // //API actually accepts invalid promotion moves and just ignores the promoting portion. 
        // //For example: d2d4q will be interpreted as d2d4.
        // if(result_command.match(/^[a-h][1-8][a-h][1-8]$/) || result_command.match(/^[a-h][1-8][a-h][1-8][qrbn]$/)){

        //     //instead of this, we will set the submit function; will finally call submit function at end of this function
        //     submitUCI(result_command);

        //     //this message displaying could be moved to the submit function for a chess move
        //     console.log("result = " + result_command);
        //     display_move.innerHTML = "UCI move detected: " + result_command + ". submitting with Board API fetch request...";
        //     return;
        // }


        // submit_function = submitSAN;
        
        // if(result_command == ''){
        //     console.log("failed to create command.");
        //     return;
        // }

        // console.log("result = " + result_command);
        // display_move.innerHTML = "press enter to submit: " + result_command;
    }
  
    async function submitMove(){

        display_move.innerHTML = "Result Move: " + result_command + ". submitting with Board API fetch request...";

        postMove(result_command);
        
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
    
    //TODO: this needs to change; can probably repurpose 'submitMove' to handle all moves that are chess moves
    // function submitSAN(){
    
    //     inputBox.value = result_command;
    // }
    
    //Submit move with Board API instantly; no 'enter' event required.
    // async function submitUCI(chessMove){
    
    //     let api_url = API_ADDRESS_TEMPLATE.replace('--UCI_MOVE--', chessMove);
    //     let fetchRequestObject = {
    
    //         method: 'POST',
    //         headers: {
    //           'Authorization': 'Bearer ' + BOARD_API_TOKEN
    //         }
        
    //       };
        
    //     fetch(api_url, fetchRequestObject)
    //         .then(res => res.json())
    //         .then(function(res){
                
    //             if(res['ok']){
    //                 display_move.innerHTML = "Successfully submitted move with Lichess API!";
                    
    //             }
    
    //             else {
    //                 display_move.innerHTML = "Error - API move submission failed...";
    //             }
    //     });
    
    // }
    
    function isUCIFormat(chessMove){
        //API actually accepts invalid promotion moves and just ignores the promoting portion. 
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
              var under_board = document.getElementsByClassName('round__underboard')[0];
              under_board.insertBefore(display_move, under_board.firstChild);
              underboard_found = true;
    
          }
    
    
        if(!material_bottom_found && (document.getElementsByClassName('material material-bottom').length > 0)){
            
            console.log("material bottom found.");
    
            document.getElementsByClassName('material material-bottom')[0].appendChild(display_listen_status);        
            material_bottom_found = true;
        }

        if(input_found && underboard_found && material_bottom_found){
            observer.disconnect();
        }
    
    }
    //TEXT INPUT FUNCTION
    // function enterMove(e){
    
    //     if(e.keyCode == 13){
    //         submitMove();
    //     }
    // }
    
    function listenKeyDown(e){
    
        if(e.keyCode == LISTEN_KEY_CODE && !holding_listen_key){
            if(toggle_hold_selection['__toggle']){
            
                is_listening ? stopDictation(): startDictation();
            }
    
            else startDictation();
            if(!holding_listen_key) holding_listen_key = true;
        
        }
    }
    function listenKeyUp(e){
    
        if(e.keyCode == LISTEN_KEY_CODE && holding_listen_key){
            holding_listen_key = false;
    
            //if hold to listen
            if(toggle_hold_selection['__toggle'] == false) stopDictation();
        }
    }
    
    function startDictation(){
        recognition.start();
        display_listen_status.innerHTML = "Listening...";
        is_listening = true;
        
    }
    
    function stopDictation(){
        recognition.stop();
        display_listen_status.innerHTML = toggle_hold_message;
        is_listening = false;
    }
    
    function clickButton(){
        let button = document.getElementsByClassName(result_UI_element)[0];

        if(button == null){
            console.log(`did not find ${result_UI_element} button.`);
            return;
        }
    
        else {
            button.click();

            if (result_UI_element === 'fbt resign') clickButton('fbt yes');
            
            if (result_UI_element === 'fbt draw-yes') clickButton('fbt yes draw-yes');
        }

        result_UI_element = '';

    }
    // function resign(){
    //     var resign_button = document.getElementsByClassName('fbt resign')[0];
    
    //     if(resign_button == null){
    //         console.log("did not find resign button.");
    //         return;
    //     }
    
    //     else {
    //         resign_button.click();
    //         var confirm_button = document.getElementsByClassName('fbt yes')[0];
    
    //         if(confirm_button == null){
    //             console.log("did not find confirm button");
    //             return;
    //         }
    //         confirm_button.click();
    
    //     }
    // }
    
    
    // function offerDraw(){
    //     var draw_button = document.getElementsByClassName('fbt draw-yes')[0];
    
    //     if(draw_button == null){
    //         console.log("did not find draw button.");
    //         return;
    //     }
    
    //     else {
    //         draw_button.click();
    //         var confirm_button = document.getElementsByClassName('fbt yes draw-yes')[0];
    
    //         if(confirm_button == null){
    //             console.log("did not find confirm button");
    //             return;
    //         }
    //         confirm_button.click();
    
    //     }
    // }
    
    // function abort(){
    
    //     var abort_button = document.getElementsByClassName('fbt abort')[0];
    
    //     if(abort_button == null){
    //         console.log("did not find abort button.");
    //         return;
    //     }
    
    //     else abort_button.click();
    // }

    // function takeBack(){
    //     var takeBack_button = document.getElementsByClassName('fbt takeback-yes')[0];
    
    //     if(takeBack_button == null){
    //         console.log("did not find takeBack button.");
    //         return;
    //     }
    
    //     else takeBack_button.click();
    
    // }

    // function acceptOffer(){
    //     var accept_button = document.getElementsByClassName('accept')[0];
    
    //     if(accept_button == null){
    //         console.log("did not find accept button");
    //         return;
    //     }
    //     accept_button.click();
    
    // }
    
    // function declineOffer(){
    //     var decline_button = document.getElementsByClassName('decline')[0];
    
    //     if(decline_button == null){
    //         console.log("did not find decline button");
    //         return;
    //     }
    //     decline_button.click();
    
    // }
    // //TODO ehhh?? white?? might not actually be piece related
    // function rematch(){
    
    //     let rematch_button = document.getElementsByClassName('fbt rematch white')[0];
    //     if(rematch_button == null){
    //         console.log("did not find rematch button");
    //         return;
    //     }
    //     rematch_button.click();
    // }
    
    // function flipBoard(){
        
    //     let flip_board_button = document.getElementsByClassName('fbt flip active')[0];
    //     if(flip_board_button == null){
    //         console.log("did not find flip board button");
    //         return;
    //     }
    //     flip_board_button.click();
    // }
    
    // function analyzeGame(){
        
    //     let analyze_button = document.getElementsByClassName('fbt analysis')[0];
    //     if(analyze_button == null){
    //         console.log("did not find analyze button");
    //         return;
    //     }
    //     analyze_button.click();
    
    // }

    function findNewGame(){
    
        let newGameUrl = "https://lichess.org/?hook_like=" + lichessLocation;
        window.open(newGameUrl);
    
    }
    
    
    function rageQuit(){
    
        let pieceList = document.getElementsByTagName('piece');
    
        for(piece of pieceList){
    
            throwPiece(piece, getRandomArbitrary(10, 250));
        }
    
        clickButton('fbt resign');
        clickButton('fbt abort');
    }
    
    
    async function throwPiece(piece, endPosition){
        
        let id = null;
        let pos = 0;
        clearInterval(id);
        id = setInterval(frame, 5);
        function frame() {
            if (pos >= endPosition) {
                clearInterval(id);
            } 
        
            else {
                pos+=2; 
                piece.style.top = "-" +pos + "px"; 
            }
        }
    }
    
    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    
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
        elementNameMap.set('flip board', 'fbt flip active');
        elementNameMap.set('analyze game', 'fbt analysis');

        
        // specialCommandMap = new Map();
        // specialCommandMap.set('resign', resign);
        // specialCommandMap.set('offer draw', offerDraw);
        // specialCommandMap.set('abort', abort);
        // specialCommandMap.set('accept', acceptOffer);
        // specialCommandMap.set('decline', declineOffer);
        // specialCommandMap.set('take back', takeBack);
        // specialCommandMap.set('new game', findNewGame);
        // specialCommandMap.set('rematch', rematch);
        // specialCommandMap.set('flip board', flipBoard);
        // specialCommandMap.set('analyze game', analyzeGame);
        // specialCommandMap.set('rage quit', rageQuit);
    }
    
    // async function testToken(token){
    //     //still throws 401 error in console if invalid token, there's probably some way to catch this
    //     display_move.innerHTML = "Checking Token...";
    //     fetch('https://lichess.org/api/account', {
        
    //         headers: {
    //             'Authorization': 'Bearer ' + token
    //         }
        
    //         })
    //         .then(res => res.json())
    //         .then(function(res){
    
    //             if(res.hasOwnProperty('error')){
    //                 display_move.innerHTML = "API token fetch failed: " + res['error']
    //                  + ". add new API token in options. User can still use SAN format submissions through the input text box.";
                    
    //             }
    //             else {
    //                 console.log("Valid API token is in use!");
    //                 BOARD_API_TOKEN = token;
    //                 display_move.innerHTML = DISPLAY_MESSAGE;
    //             }
    //         });
    // }
}


