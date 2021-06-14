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

// var fuzzyKeyWords = new Map();
// fuzzyKeyWords.set('night', 'knight');
// fuzzyKeyWords.set('brooke', 'rook');
// fuzzyKeyWords.set('kapture', 'capture');
// fuzzyKeyWords.set('force', '4');
// fuzzyKeyWords.set('ford', '4');
// fuzzyKeyWords.set('clean', 'queen');
// fuzzyKeyWords.set('sticks', '6');
// fuzzyKeyWords.set('iv', '4');
// fuzzyKeyWords.set('stix','6');

var inputBox;
var resultMove = '';
var downBool = false;

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
        

        /**
         * TODO: currently adding ALL changes made to our fuzzyKeyWords_Object. Including
         * Last move changes! need to filter to only add new trouble words.
         * UPDATE: actually...only effects key value pair of the key last_command... technically fine i guess!
         * 
         */
        console.log(item + " has changed:");
        console.log("Old value: ");
        console.log(changes[item].oldValue);
        console.log("New value: ");
        console.log(changes[item].newValue);
        fuzzyKeyWords_Object[item] = changes[item].newValue;
    }
});

// Can probably remove this safely at this point; just using regular key events

// chrome.runtime.onMessage.addListener(function (message) {
//     const { command_entered } = message;

//     if (command_entered === 'listen-for-move'){

//         console.log("you pressed ctrl space!");
//         recognition.start();
//     }

//     else console.log("apparently you pressed: " + pressed_key);
// });

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
    for(const word of wordArray){
        if(fuzzyKeyWords_Object[word] != null){

            //replace with key value; implement check for multi word replacement later.
            result.push(fuzzyKeyWords_Object[word]);
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
        // inputBox.dispatchEvent(ke);
        resultMove = '';
    }

    else console.log("no move stored yet.");
}


function waitForInputBox(){
    if(document.getElementsByClassName('ready').length > 0){
        console.log(" the number of 'ready' elements is: " + document.getElementsByClassName('ready').length);
        inputBox = document.getElementsByClassName('ready')[0];
        document.body.dispatchEvent(ke);
        observer.disconnect();
    }
}

function enterMove(e){

    if(e.keyCode == 13){
        console.log("do the thing");

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
        console.log("space up.");
        downBool = false;
        recognition.stop();
    }
}
