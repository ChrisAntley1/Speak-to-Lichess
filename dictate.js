console.log("You are on Lichess!");

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
// display_move.style.fontSize = '13px';
var resultMove = '';
var downBool = false;
var input_found_flag = false;

const observer = new MutationObserver(waitForInputBox);
observer.observe(document, {subtree: true, childList: true});

const ke = new KeyboardEvent('keydown', {
    bubbles: true, keyCode: 13
});

document.addEventListener('keydown', enterMove);
document.addEventListener('keydown', spaceDown);
document.addEventListener('keyup', spaceUp);


//retrieve trouble words/phrases list
var fuzzyKeyWords_Object;
chrome.storage.local.get(fuzzyKeyWords_Object, function(result){

    fuzzyKeyWords_Object = result;
    console.log(fuzzyKeyWords_Object);

});

chrome.storage.onChanged.addListener(function(changes, area) {
    console.log("Change in storage area: " + area);
  
    let changedItems = Object.keys(changes);
  
    for (let item of changedItems) {
        
        if (item != 'last_command') fuzzyKeyWords_Object[item] = changes[item].newValue;
    }
});

recognition.onresult = function(event) {

    var last = event.results.length - 1;
    var command = event.results[last][0].transcript;

    console.log("Raw voice input: " + command);

    var processedCommand = processRawInput(command);
    
    console.log('Processed voice input: ' + processedCommand);

    resultMove = createChessMove(processedCommand);

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
    message.textContent = 'Error occurred in recognition: ' + event.error;
}        


function processRawInput(command){
    
    command = command.toLowerCase();
    command = command.replace(/([^0-9])([0-9])/g, '$1 $2');
    command = replacePunctuation(command);

    //save the phrase to show the user, still with potentially troublesome words
    chrome.storage.local.set({last_command: command}, function(){

        chrome.storage.local.get(['last_command'], function(result){
            console.log(result);
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
        
        if(resultMove.match(/[a-h][1-8][a-h][1-8]/)){

            //was getting ready to implement this, then remembered that 
            //square-to-square format was failing on Lichess =\
            console.log("Square to square format not yet supported. wompwomp =/");
        }
        else inputBox.value = resultMove;
        resultMove = '';
        display_move.innerHTML = '';
    }

    else console.log("no move stored yet.");
}


function waitForInputBox(){

    if(!input_found_flag && document.getElementsByClassName('ready').length > 0){
        console.log(" the number of 'ready' elements is: " + document.getElementsByClassName('ready').length);
        inputBox = document.getElementsByClassName('ready')[0];
        document.body.dispatchEvent(ke);
        input_found_flag = true;
    }

    if(input_found_flag && document.getElementsByClassName('round__underboard').length > 0){
        
        document.getElementsByClassName('round__underboard')[0].appendChild(display_move);
        observer.disconnect();
    }
}

function enterMove(e){

    if(e.keyCode == 13){
        // console.log("do the thing");

        submitMove();
    }
}

function spaceDown(e){

    if(e.keyCode == 32 && downBool == false && e.ctrlKey == true){
        downBool = true;
        recognition.start();
    }
}
function spaceUp(e){

    if(e.keyCode == 32 && downBool == true){
        // console.log("space up.");
        downBool = false;
        recognition.stop();
    }
}
