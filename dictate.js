
const lichessLocation = location.href
                    .replace('http://', '')
                    .replace('https://', '')
                    .replace('lichess.org/', '')
                    .replace('lichess.org', '');

// let isOngoingGame = false;

// if(checkIfGamePage(lichessLocation)){
//     console.log("might be ongoing game...");
//     isOngoingGame = checkIfActiveGame().then(res =>{
//         console.log(res);
//     });
//     console.log(isOngoingGame);
// }

// if(!isOngoingGame) console.log("Not ongoing game page.");

// else {

if(checkIfGamePage(lichessLocation)){
    /**
     * So here we know that the page may contain an active game. We need these variables declared outside of functions for global use.
     * However, we could instantiate them in an async function that waits for the results of the API call; and if the API call returns negative, then 
     * we can save some space and work by not initializing anything else. 
     */
    console.log("Might be ongoing game, doing the thing");

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

    /**
     * TODO: store and retrieve this from local storage
     */
    var BOARD_API_TOKEN = 'NeycshINSAk7hQ2I';

    //Maps for checking and handling key words
    var numberMap;
    var chessTermMap;
    var commandFunctionMap;

    //creating our key word maps
    createKeyWordMaps();

    //HTML elements. inputBox is created by another script most likely and is not yet created, even when script is run at document_end (in manifest)
    var display_move = document.createElement('strong');
    var display_listen_status = document.createElement('strong');
    var inputBox; 

    //flags and other variables
    var toggle_hold_message = '';
    var result_command = '';
    var holding_listen_key = false;
    var input_found = false;
    var underboard_found = false;
    var material_bottom_found = false;
    var is_listening = false;

    //function that will be called depending on spoken command/move
    var submit_function;

    //document observer; observes DOM until inputBox (and a couple other elements) have been located.
    var observer = new MutationObserver(waitForInputBox);
    observer.observe(document, {subtree: true, childList: true});

    recognition.addEventListener('end', function() {
        if (is_listening == true) recognition.start();
    });

    var word_replacement_list;
    var toggle_hold_selection;

    chrome.storage.local.get(word_replacement_list, function(result){
        word_replacement_list = result;
    });

    chrome.storage.local.get(toggle_hold_selection, function(result){

        toggle_hold_selection = result;
        if(toggle_hold_selection['__toggle']) toggle_hold_message = "Press ctrl to toggle on/off dictation";
        else toggle_hold_message = "Press and hold ctrl to dictate";

        display_listen_status.innerHTML = toggle_hold_message;
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

                
                recognition.stop();
            } 
            else if (item != 'last_command') word_replacement_list[item] = changes[item].newValue;
        }
    });

    //when recognition decides it has heard an entire phrase:
    recognition.onresult = function(event) {

        let command = event.results[event.results.length - 1][0].transcript;

        console.log("Raw voice input: " + command);

        if(commandFunctionMap.has(command)){
            submit_function = commandFunctionMap.get(command);
            result_command = command;

            //store command in last_command 
            chrome.storage.local.set({last_command: command});
        }

        else {
            let processedCommand_array = processRawInput(command);
            console.log('Processed voice input: ' + processedCommand_array);

            result_command = createChessMove(processedCommand_array);

            /**
             * TODO: Check for UCI or SAN; either fetch or submit to text box accordingly.
             * Adjust UCI check to also read special moves like promotions.
             */
            if(result_command.match(/[a-h][1-8][a-h][1-8]/)){

                submitUCI(result_command);
                console.log("result = " + result_command);
                display_move.innerHTML = "UCI move detected: " + result_command + ". submitting with Board API fetch request...";
                return;
            }
    

            submit_function = submitSAN;
            
            if(result_command == ''){
                console.log("failed to create command.");
                return;
            }
        }

        console.log("result = " + result_command);
        display_move.innerHTML = "press enter to submit: " + result_command;

    };

    /**
     * TODO: there was something about the listening I wanted to change.
     * 
     * While using toggle listening, for the sake of speed, provide user key to immediately submit a move?
     * In the same vein, provide key to ignore whatever has been heard in the immediate listening sesion?
     * 
     */
    recognition.onspeechend = function() {
        recognition.stop();
    };

    recognition.onerror = function(event) {
        console.log('Speech recognition error detected: ' + event.error);
    }        
}


function processRawInput(command){
    
    //replace any capital letters;
    //put a space between 'letter-number' instances;
    //replace any punctuation with a space. 
    command = command.toLowerCase();

    //this creates an extra space; doesn't seem to cause problems
    command = command.replace(/([^0-9])([0-9])/g, '$1 $2');
    command = command.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

    //save the phrase to show the user in popup what phrase was heard (before replacing any words)
    chrome.storage.local.set({last_command: command}, function(){

        //can delete this
        // chrome.storage.local.get(['last_command'], function(result){
        // });
    });

    return replaceWords(command.split(' '));
}
function createChessMove(phrase){

    var chessMove = '';
    for(const word of phrase){
        chessMove += extractCharacter(word);
    }
    return chessMove;
}

function replaceWords(wordArray){

    let result = [];
    let replacementPhrase = '';
    for(const word of wordArray){
        if(word_replacement_list[word] != null && word_replacement_list[word] != undefined){

            //split replacement phrase. if just a single word, replacementPhrase will be an array of length 1; 
            //no additional code should be needed.
            replacementPhrase = word_replacement_list[word].split(' ');
            for(const subWord of replacementPhrase){
                result.push(subWord);
            }
        }

        else result.push(word);
    }

    return result;
}

function extractCharacter(word){

    if(word.match(/\d/) == null){

        if(chessTermMap.has(word)){
            return chessTermMap.get(word);
        }

        else if(numberMap.has(word)){
            return numberMap.get(word);
        }
    }

    //if here: get first letter of word/get digit
    return word.charAt(0);
}

function replacePunctuation(word){

    return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
}
    
function submitMove(){

    if(result_command.length != 0){
        
        submit_function();
        result_command = '';
        display_move.innerHTML = DISPLAY_MESSAGE;
    
    }
    else console.log("no move stored yet.");
}

function submitSAN(){

    inputBox.value = result_command;
}

//Submit move with Board API instantly; no 'enter' event required.
async function submitUCI(chessMove){

    let api_url = API_ADDRESS_TEMPLATE.replace('--UCI_MOVE--', chessMove);
    let fetchRequestObject = {

        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + BOARD_API_TOKEN
        }
    
      };
    
    fetch(api_url, fetchRequestObject)
        .then(res => res.json())
        .then(function(res){
            
            if(res['ok']){
                display_move.innerHTML = "Successfully submitted move with Lichess API!";
                
            }

            else {
                display_move.innerHTML = "Error - API move submission failed...";
            }
            console.log(res);
    });

}

function waitForInputBox(){


    if(!input_found && document.getElementsByClassName('ready').length > 0){
        
        console.log("input found.");

        inputBox = document.getElementsByClassName('ready')[0];
        document.addEventListener('keydown', enterMove);
        document.addEventListener('keydown', listenKeyDown);
        document.addEventListener('keyup', listenKeyUp);
        document.addEventListener('visibilitychange', function() {
            stopDictation();
            holding_listen_key = false;
        });
        
        input_found = true;

    }

    if(input_found && !underboard_found && document.getElementsByClassName('round__underboard').length > 0){ 
        
        console.log("underboard found.");

        var under_board = document.getElementsByClassName('round__underboard')[0];
        display_move.innerHTML = DISPLAY_MESSAGE
        under_board.insertBefore(display_move, under_board.firstChild);
        underboard_found = true;
    }

    if(underboard_found && !material_bottom_found && (document.getElementsByClassName('material material-bottom').length > 0)){
        
        console.log("material bottom found.");

        document.getElementsByClassName('material material-bottom')[0].appendChild(display_listen_status);        
        material_bottom_found = true;
        observer.disconnect();
    }
}

function enterMove(e){

    if(e.keyCode == 13){
        submitMove();
    }
}

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

function resign(){
    var resign_button = document.getElementsByClassName('fbt resign')[0];

    if(resign_button == null){
        console.log("did not find resign button.");
        return;
    }

    else {
        resign_button.click();
        var confirm_button = document.getElementsByClassName('fbt yes')[0];

        if(confirm_button == null){
            console.log("did not find confirm button");
            return;
        }
        confirm_button.click();

    }
}

function abort(){

    var abort_button = document.getElementsByClassName('fbt abort')[0];

    if(abort_button == null){
        console.log("did not find abort button.");
        return;
    }

    else abort_button.click();
}

function takeBack(){
    var takeBack_button = document.getElementsByClassName('fbt takeback-yes')[0];

    if(takeBack_button == null){
        console.log("did not find takeBack button.");
        return;
    }

    else takeBack_button.click();

}
function offerDraw(){
    var draw_button = document.getElementsByClassName('fbt draw-yes')[0];

    if(draw_button == null){
        console.log("did not find draw button.");
        return;
    }

    else {
        draw_button.click();
        var confirm_button = document.getElementsByClassName('fbt yes draw-yes')[0];

        if(confirm_button == null){
            console.log("did not find confirm button");
            return;
        }
        confirm_button.click();

    }
}

function acceptOffer(){
    var accept_button = document.getElementsByClassName('accept')[0];

    if(accept_button == null){
        console.log("did not find accept button");
        return;
    }
    accept_button.click();

}

function declineOffer(){
    var decline_button = document.getElementsByClassName('decline')[0];

    if(decline_button == null){
        console.log("did not find decline button");
        return;
    }
    decline_button.click();

}

/**
 * TODO: Previously played games will still return true! They use the entire 12 character id in the URL. 
 * Can either only run script on 8 character games, or check if current game (possibly through API fetch)
 */
function checkIfGamePage(location){
    
    //locations with 8 or 12 alphanumeric characters
    const KNOWN_LOCATIONS = [
        'analysis',
        'streamer',
        'practice',
        'training'];

    let numChars = location.length;
    
    //check if on home page (lichess.org/) or location is somehow null or undefined
    if(numChars != null || numChars != undefined || numChars != 0){

        //check if alphanumeric; if not, then can't be game page
        /**
         * TODO: Make sure the above condition is actually the case; not sure if options can be attached to game page url!
         */
        if(location.match(/^[a-z0-9]+$/i)){

            //check length of alphanumeric string. if 8 or 12, then might be game page
            if(numChars == 8 || numChars == 12){

                //finally, make sure location is not in our known location list:

                if(!KNOWN_LOCATIONS.includes(location)){
                    
                    
                    //We know it is probably an ongoing game; Could now execute fetch request to see if it is an ongoing game. 
                    //Executes much less, seems like a reasonable filter.
                    console.log("do the thing!");
                    return true;
                }
            }
        }
    }

    console.log("don't do the thing!");
    return false;
}

//Not currently being used; didn't want to completely restructure code
async function checkIfActiveGame(){

    let response = await fetch('https://lichess.org/api/account/playing', {
    
    headers: {
      'Authorization': 'Bearer ' + BOARD_API_TOKEN
    }

    });

    if(!response.ok){
        throw new Error("shit didn't work yo");
    }
    let gameList = await response.json();

    console.log(gameList);
    for(game_info of gameList.nowPlaying){

        if(game_info.fullId === lichessLocation || game_info.gameId === lichessLocation){
            console.log(game_info);
            return true;
            // board_api_url = createTemplateURL();
        }
    }
    return false;
        // response.json().then(function(res){
        
        //     console.log(res);
        //     let found = false;
        //     for(game_info of res.nowPlaying){
    
        //         if(game_info.fullId === lichessLocation || game_info.gameId === lichessLocation){
        //             console.log(game_info);
        //             return true;
        //             // board_api_url = createTemplateURL();
        //         }
        //     }
    
        //     return false;
        // });
    }

    function createKeyWordMaps(){
        numberMap = new Map();
        numberMap.set('one', '1');
        numberMap.set('two', '2');
        numberMap.set('three', '3');
        numberMap.set('four', '4');
        numberMap.set('five', '5');
        numberMap.set('six', '6');
        numberMap.set('seven', '7');
        numberMap.set('eight', '8');

        chessTermMap = new Map();
        chessTermMap.set('king', 'k');
        chessTermMap.set('queen', 'q');
        chessTermMap.set('rook', 'r');
        chessTermMap.set('bishop', 'b');
        chessTermMap.set('knight', 'n');
        chessTermMap.set('capture', 'x');
        chessTermMap.set('take', 'x');
        chessTermMap.set('promote', '=');
        chessTermMap.set('equals', '=');
        chessTermMap.set('castle', '0-0');
        chessTermMap.set('long', '0-');
        chessTermMap.set('short', '');

        commandFunctionMap = new Map();
        commandFunctionMap.set('resign', resign);
        commandFunctionMap.set('offer draw', offerDraw);
        commandFunctionMap.set('abort', abort);
        commandFunctionMap.set('accept', acceptOffer);
        commandFunctionMap.set('decline', declineOffer);
        commandFunctionMap.set('take back', takeBack);
    }