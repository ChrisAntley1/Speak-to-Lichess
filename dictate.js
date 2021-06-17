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
chessKeyWords.set('promote', '=');
chessKeyWords.set('equals', '=');
chessKeyWords.set('castle', '0-0');
chessKeyWords.set('long', '0-');
chessKeyWords.set('short', '');

var inputBox;
var display_move = document.createElement('strong');
display_move.innerHTML = "Your move will appear here."
var display_listen_status = document.createElement('strong');

// display_move.style.fontSize = '13px';
var resultMove = '';
var downBool = false;
var input_found_flag = false;
var found_underboard_flag = false;
var found_material_bottom_flag = false;
var submit_function;

const LISTEN_KEY_CODE = 17;
var TOGGLE_LISTEN;
var LISTENING = false;
const observer = new MutationObserver(waitForInputBox);
observer.observe(document, {subtree: true, childList: true});

const ke = new KeyboardEvent('keydown', {
    bubbles: true, keyCode: 13
});

document.addEventListener('keydown', enterMove);
document.addEventListener('keydown', listen_key_down);
document.addEventListener('keyup', listen_key_up);

recognition.addEventListener('end', function() {
    if (LISTENING == true) recognition.start();
});
  
//retrieve trouble words/phrases list
var fuzzyKeyWords_Object;
chrome.storage.local.get(fuzzyKeyWords_Object, function(result){

    fuzzyKeyWords_Object = result;
    // TOGGLE_LISTEN = fuzzyKeyWords_Object['_TOGGLE_LISTEN'];
    // console.log(TOGGLE_LISTEN);
});

chrome.storage.local.get(TOGGLE_LISTEN, function(result){

    TOGGLE_LISTEN = result;
    if(TOGGLE_LISTEN['__toggle']) display_listen_status.innerHTML = "Press ctrl to toggle on/off dictation";
    else display_listen_status.innerHTML = "Press and hold ctrl to dictate";

});

chrome.storage.onChanged.addListener(function(changes, area) {
  
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
        
        if(item === '__toggle'){
            TOGGLE_LISTEN[item] = changes[item].newValue;
            
            if(TOGGLE_LISTEN['__toggle']) display_listen_status.innerHTML = "Press ctrl to toggle on/off dictation";
            else display_listen_status.innerHTML = "Press and hold ctrl to dictate";

            recognition.stop();
        } 
        else if (item != 'last_command') fuzzyKeyWords_Object[item] = changes[item].newValue;
    }
});

recognition.onresult = function(event) {

    var last = event.results.length - 1;
    var command = event.results[last][0].transcript;

    console.log("Raw voice input: " + command);

    var processedCommand_array = processRawInput(command);
    
    console.log('Processed voice input: ' + processedCommand_array);

    if(processedCommand_array[0] === 'resign'){
        resultMove = "resign";
        submit_function = resign;
    }

    else if(processedCommand_array[0] === 'abort'){
        resultMove = "abort";
        submit_function = abort;
    }

    else if(processedCommand_array[0] === "offer" && processedCommand_array[1] === "draw"){
        resultMove = "offer draw";
        submit_function = draw;
    }

    else if(processedCommand_array[0] === "take" && processedCommand_array[1] === "back"){
        resultMove = "take-back";
        submit_function = takeBack;
    }
    else if(processedCommand_array[0] === 'accept'){
        resultMove = "accept offer";
        submit_function = accept_offer;

    }

    else if(processedCommand_array[0] === 'decline'){
        resultMove = "decline offer";
        submit_function = decline_offer;

    }
    
    else {
        resultMove = createChessMove(processedCommand_array);
        submit_function = inputMove;
    }
    if(resultMove == ''){
        console.log("failed to create chess move.");
        return;
    }

    console.log("result = " + resultMove);
    display_move.innerHTML = "press enter to submit: " + resultMove;

};

recognition.onspeechend = function() {
    recognition.stop();
};

recognition.onerror = function(event) {
    console.log('Speech recognition error detected: ' + event.error);
}        


function processRawInput(command){
    
    command = command.toLowerCase();
    command = command.replace(/([^0-9])([0-9])/g, '$1 $2');
    command = replacePunctuation(command);

    //save the phrase to show the user, still with potentially troublesome words
    chrome.storage.local.set({last_command: command}, function(){

        chrome.storage.local.get(['last_command'], function(result){
        });
    });

    return replaceTroubleWords(command.split(' '));
}
function createChessMove(phrase){

    var chessMove = '';
    for(const word of phrase){
        chessMove += extractCharacter(word);
    }
    return chessMove;
}

function replaceTroubleWords(wordArray){

    var result = [];
    var replacementPhrase = '';
    for(const word of wordArray){
        if(fuzzyKeyWords_Object[word] != null && fuzzyKeyWords_Object[word] != undefined){

            //split replacement phrase. if just a single word, replacementPhrase will be an array of length 1; 
            //no additional code should be needed.
            replacementPhrase = fuzzyKeyWords_Object[word].split(' ');
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

    if(resultMove.length != 0){
        
        submit_function();
        resultMove = '';
        display_move.innerHTML = '';
    
    }

    else console.log("no move stored yet.");
}

function inputMove(){

    if(resultMove.match(/[a-h][1-8][a-h][1-8]/)){

        //was getting ready to implement this, then remembered that 
        //square-to-square format was failing on Lichess =\
        console.log("Square to square format not yet supported. wompwomp =/");
    }
    else inputBox.value = resultMove;
}

function waitForInputBox(){

    if(!input_found_flag && document.getElementsByClassName('ready').length > 0){
        inputBox = document.getElementsByClassName('ready')[0];
        document.body.dispatchEvent(ke);
        input_found_flag = true;
    }

    else if(!found_underboard_flag && document.getElementsByClassName('round__underboard').length > 0){
        
        document.getElementsByClassName('round__underboard')[0].appendChild(display_move);
        found_underboard_flag = true;
    }

    else if(!found_material_bottom_flag && (document.getElementsByClassName('material material-bottom').length > 0)){
        
        document.getElementsByClassName('material material-bottom')[0].appendChild(display_listen_status);        
        found_material_bottom_flag = true;
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
        if(TOGGLE_LISTEN['__toggle']){
        
            if(!LISTENING){
                recognition.start();
                LISTENING = true;
                display_listen_status.innerHTML = "Listening...";
            }
    
            else {
                recognition.stop();
                LISTENING = false;
                display_listen_status.innerHTML = "Press ctrl to toggle on/off dictation";

            }
        }
        else if(downBool == false){
            downBool = true;
            recognition.start();
            display_listen_status.innerHTML = "Listening...";

        }
    
    }
}
function listen_key_up(e){

    if(e.keyCode == LISTEN_KEY_CODE && downBool == true && TOGGLE_LISTEN['__toggle'] == false){
        downBool = false;
        recognition.stop();
        display_listen_status.innerHTML = "Press and hold ctrl to dictate";

    }
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
