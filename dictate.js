
const lichessLocation = location.href
                    .replace('http://', '')
                    .replace('https://', '')
                    .replace('lichess.org/', '')
                    .replace('lichess.org', '');


if(checkIfGamePage(lichessLocation)){

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
    var NO_TOKEN_MESSAGE = "No API token! Open options page and set a valid API token to use both UCI format and automatic move submission."
    
    //Maps for checking and handling key words
    var numberMap;
    var chessTermMap;
    var commandFunctionMap;

    //creating our key word maps
    createKeyWordMaps();

    //HTML elements. inputBox is created by another script most likely and is not yet created,
    //even when script is run at document_end (in manifest)
    var display_move = document.createElement('strong');
    display_move.innerHTML = DISPLAY_MESSAGE;

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

                
                recognition.stop();
            } 
            else if (item != 'last_command') word_replacement_list[item] = changes[item].newValue;
        }
    });

    /**
     * SPEECH RECOGNITION SECTION 
     */
    recognition.onresult = function(event) {

        let command = event.results[event.results.length - 1][0].transcript;

        console.log("Raw voice input: " + command);

        let processedCommand_array = processRawInput(command);
        let checkForCommandAgainPhrase = '';
        
        for(word of processedCommand_array)
            checkForCommandAgainPhrase+= (word + ' ');
        checkForCommandAgainPhrase = checkForCommandAgainPhrase.slice(0, -1);

        if(commandFunctionMap.has(checkForCommandAgainPhrase)){
            submit_function = commandFunctionMap.get(checkForCommandAgainPhrase);
            result_command = checkForCommandAgainPhrase;

            //store command in last_command, to display in popup window
            chrome.storage.local.set({last_command: checkForCommandAgainPhrase});

            console.log("result = " + result_command);
            display_move.innerHTML = "press enter to submit: " + result_command;
            
            return;
        }

        console.log('Processed voice input: ' + processedCommand_array);

        result_command = createChessMove(processedCommand_array);

        //API actually accepts invalid promotion moves and just ignores the promoting portion. 
        //For example: d2d4q will be interpreted as d2d4.
        if(result_command.match(/^[a-h][1-8][a-h][1-8]$/) || result_command.match(/^[a-h][1-8][a-h][1-8][qrbn]$/)){

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

        console.log("result = " + result_command);
        display_move.innerHTML = "press enter to submit: " + result_command;

    };

    recognition.onspeechend = function() {
        recognition.stop();
        console.log("recognition speech end");
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
    command = command.replace(/([0-9])([^0-9])/g, '$1 $2');
    command = command.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

    while(command.includes('  ')){
        command = command.replace('  ', ' ');
    }

    //save the phrase to show the user in popup what phrase was heard (before replacing any words)
    chrome.storage.local.set({last_command: command}, function(){

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

function findNewGame(){

    let newGameUrl = "https://lichess.org/?hook_like=" + lichessLocation;
    window.open(newGameUrl);

}

function rematch(){

    let rematch_button = document.getElementsByClassName('fbt rematch white')[0];
    if(rematch_button == null){
        console.log("did not find rematch button");
        return;
    }
    rematch_button.click();
}

function flipBoard(){
    
    let flip_board_button = document.getElementsByClassName('fbt flip active')[0];
    if(flip_board_button == null){
        console.log("did not find flip board button");
        return;
    }
    flip_board_button.click();
}

function analyzeGame(){
    
    let analyze_button = document.getElementsByClassName('fbt analysis')[0];
    if(analyze_button == null){
        console.log("did not find analyze button");
        return;
    }
    analyze_button.click();

}

function rageQuit(){

    let pieceList = document.getElementsByTagName('piece');

    for(piece of pieceList){

        throwPiece(piece, getRandomArbitrary(10, 250));
    }

    abort();
    resign();
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
    commandFunctionMap.set('new game', findNewGame);
    commandFunctionMap.set('rematch', rematch);
    commandFunctionMap.set('flip board', flipBoard);
    commandFunctionMap.set('analyze game', analyzeGame);
    commandFunctionMap.set('rage quit', rageQuit);
}

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
        if(location.match(/^[a-z0-9]+$/i)){

            //check length of alphanumeric string. if 8 or 12, then might be game page
            if(numChars == 8 || numChars == 12){

                //finally, make sure location is not in our known location list:
                if(!KNOWN_LOCATIONS.includes(location)){
                    
                    return true;
                }
            }
        }
    }

    return false;
}


async function testToken(token){
    display_move.innerHTML = "Checking Token...";
    fetch('https://lichess.org/api/account', {
    
        headers: {
            'Authorization': 'Bearer ' + token
        }
    
        })
        .then(res => res.json())
        .then(function(res){

            if(res.hasOwnProperty('error')){
                display_move.innerHTML = "API token fetch failed: " + res['error']
                 + ". add new API token in options. User can still use SAN format submissions through the input text box.";
                
            }
            else {
                console.log("Valid API token is in use!");
                BOARD_API_TOKEN = token;
                display_move.innerHTML = DISPLAY_MESSAGE;
            }
        });
}


