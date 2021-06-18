// var lichess_location = location.href;

// if(lichess_location.match(/\/[a-zA-Z0-9]/))
console.log("You are on Lichess! " + location.href);

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

var grammar = '#JSGF V1.0;';
var recognition = new SpeechRecognition();
var speechRecognitionGrammarList = new SpeechGrammarList();
speechRecognitionGrammarList.addFromString(grammar, 1);

recognition.grammars = speechRecognitionGrammarList;
recognition.lang = 'en-US';
recognition.interimResults = false;

var numberMap = new Map();
numberMap.set('one', '1');
numberMap.set('two', '2');
numberMap.set('three', '3');
numberMap.set('four', '4');
numberMap.set('five', '5');
numberMap.set('six', '6');
numberMap.set('seven', '7');
numberMap.set('eight', '8');

var chessKeyWords = new Map();
chessKeyWords.set('king', 'k');
chessKeyWords.set('queen', 'q');
chessKeyWords.set('rook', 'r');
chessKeyWords.set('bishop', 'b');
chessKeyWords.set('knight', 'n');
chessKeyWords.set('capture', 'x');
chessKeyWords.set('take', 'x');
chessKeyWords.set('promote', '=');
chessKeyWords.set('equals', '=');
chessKeyWords.set('castle', '0-0');
chessKeyWords.set('long', '0-');
chessKeyWords.set('short', '');

var nonChessCommands = new Map();
nonChessCommands.set('resign', resign);
nonChessCommands.set('offer draw', draw);
nonChessCommands.set('abort', abort);
nonChessCommands.set('accept', accept_offer);
nonChessCommands.set('decline', decline_offer);
nonChessCommands.set('take back', take_back);


var inputBox;
var display_move = document.createElement('strong');
var display_listen_status = document.createElement('strong');

var toggle_hold_message = '';
var result_command = '';
var holding_listen_key = false;
var input_found = false;
var underboard_found = false;
var material_bottom_found = false;
var is_listening = false;
var submit_function;

const LISTEN_KEY_CODE = 17;
const observer = new MutationObserver(waitForInputBox);
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

    var command = event.results[event.results.length - 1][0].transcript;

    console.log("Raw voice input: " + command);

    if(nonChessCommands.has(command)){
        submit_function = nonChessCommands.get(command);
        result_command = command;
    }

    else {
        var processedCommand_array = processRawInput(command);
        console.log('Processed voice input: ' + processedCommand_array);

        result_command = createChessMove(processedCommand_array);
        submit_function = inputMove;
        
        if(result_command == ''){
            console.log("failed to create command.");
            return;
        }
    }

    console.log("result = " + result_command);
    display_move.innerHTML = "press enter to submit: " + result_command;

};

recognition.onspeechend = function() {
    recognition.stop();
};

recognition.onerror = function(event) {
    console.log('Speech recognition error detected: ' + event.error);
}        


function processRawInput(command){
    
    //replace any capital letters;
    //put a space between 'letter-number' instances;
    //replace any punctuation with a space. 
    command = command.toLowerCase();
    command = command.replace(/([^0-9])([0-9])/g, '$1 $2');
    command = command.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

    //save the phrase to show the user in popup what phrase was heard (before replacing any words)
    chrome.storage.local.set({last_command: command}, function(){

        chrome.storage.local.get(['last_command'], function(result){
        });
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

    var result = [];
    var replacementPhrase = '';
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

        if(chessKeyWords.has(word)){
            return chessKeyWords.get(word);
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
        display_move.innerHTML = '';
    
    }

    else console.log("no move stored yet.");
}

function inputMove(){

    if(result_command.match(/[a-h][1-8][a-h][1-8]/)){

        //was getting ready to implement this, then remembered that 
        //square-to-square format was failing on Lichess =\
        console.log("Square to square format not yet supported. wompwomp =/");
    }
    else inputBox.value = result_command;
}

function waitForInputBox(){


    if(!input_found && document.getElementsByClassName('ready').length > 0){
        
        console.log("input found.");

        inputBox = document.getElementsByClassName('ready')[0];
        document.addEventListener('keydown', enterMove);
        document.addEventListener('keydown', listen_key_down);
        document.addEventListener('keyup', listen_key_up);
        document.addEventListener('visibilitychange', function() {
            stop_dictation();
            holding_listen_key = false;
        });
        
        input_found = true;

    }

    else if(input_found && !underboard_found && document.getElementsByClassName('round__underboard').length > 0){ 
        
        console.log("underboard found.");

        var under_board = document.getElementsByClassName('round__underboard')[0];
        display_move.innerHTML = "Your move will appear here."
        under_board.insertBefore(display_move, under_board.firstChild);
        underboard_found = true;
    }

    else if(underboard_found && !material_bottom_found && (document.getElementsByClassName('material material-bottom').length > 0)){
        
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

function listen_key_down(e){

    if(e.keyCode == LISTEN_KEY_CODE){
        if(toggle_hold_selection['__toggle']){
        
            is_listening ? stop_dictation(): start_dictation();
        }
        else if(!holding_listen_key
        ){
            holding_listen_key = true;
            start_dictation();
        }
    
    }
}
function listen_key_up(e){

    if(e.keyCode == LISTEN_KEY_CODE && holding_listen_key && toggle_hold_selection['__toggle'] == false){
        holding_listen_key = false;
        stop_dictation();
    }
}

function start_dictation(){
    recognition.start();
    display_listen_status.innerHTML = "Listening...";
    is_listening = true;
}

function stop_dictation(){
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

function take_back(){
    var take_back_button = document.getElementsByClassName('fbt takeback-yes')[0];

    if(take_back_button == null){
        console.log("did not find takeBack button.");
        return;
    }

    else take_back_button.click();

}
function draw(){
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

function accept_offer(){
    var accept_button = document.getElementsByClassName('accept')[0];

    if(accept_button == null){
        console.log("did not find accept button");
        return;
    }
    accept_button.click();

}

function decline_offer(){
    var decline_button = document.getElementsByClassName('decline')[0];

    if(decline_button == null){
        console.log("did not find decline button");
        return;
    }
    decline_button.click();

}
