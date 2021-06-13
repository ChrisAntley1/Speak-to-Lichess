console.log("You are on Lichess!");

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

// var grammar = '#JSGF V1.0; grammar pieces; public <pieces> = knight | bishop | pawn | rook | queen | king ;';
var grammar = '#JSGF V1.0;';
var recognition = new SpeechRecognition();
var speechRecognitionGrammarList = new SpeechGrammarList();
speechRecognitionGrammarList.addFromString(grammar, 1);

recognition.grammars = speechRecognitionGrammarList;
recognition.lang = 'en-US';
recognition.interimResults = false;


/**
 * TODO: problem and solution tables are kinda dumb
 */
var textNumbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
var problemWords = ['won', 'to', 'too', 'for', 'v', 'sex', 'hate', 'ate', 'ii'];
var solutionWords = ['1', '2', '2', '4', '5', '6', '8', '8', '2'];
// var chessPieces = ['king', 'queen', 'rook', 'bishop', 'knight'];
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

var fuzzyKeyWords = new Map();
fuzzyKeyWords.set('night', 'n');
fuzzyKeyWords.set('brooke', 'r');
fuzzyKeyWords.set('kapture', 'x');
fuzzyKeyWords.set('force', '4');
fuzzyKeyWords.set('ford', '4');
fuzzyKeyWords.set('clean', 'q');
fuzzyKeyWords.set('sticks', '6');
fuzzyKeyWords.set('iv', '4');
fuzzyKeyWords.set('stix','6');



var inputBox;
// var resultMove = [];
var resultMove = '';
const observer = new MutationObserver(waitForInputBox);
observer.observe(document, {subtree: true, childList: true});

const ke = new KeyboardEvent('keydown', {
    bubbles: true, keyCode: 13
});

document.addEventListener('keydown', enterMove);
document.addEventListener('keydown', spaceDown);
document.addEventListener('keyup', spaceUp);

var downBool = false;

chrome.runtime.onMessage.addListener(function (message) {
    const { command_entered } = message;

    if (command_entered === 'listen-for-move'){

        console.log("you pressed ctrl space!");
        recognition.start();
    }

    else console.log("apparently you pressed: " + pressed_key);
});

recognition.onresult = function(event) {

    var last = event.results.length - 1;
    var command = event.results[last][0].transcript;

    console.log("Raw voice input: " + command);
    command = command.toLowerCase();
    command = command.replace(/([^0-9])([0-9])/g, '$1 $2');
    command = replacePunctuation(command);

    //save the last phrase heard, to show the user in pop_up window
    chrome.storage.local.set({last_command: command}, function(){

        chrome.storage.local.get(['last_command'], function(result){
            console.log(result);
        });
    });
    
    /**
     * TODO: handle word# (golf6) input
     */
    var parsed = command.split(' ');
    console.log('Formatted voice input: ' + command);


    resultMove = createChessMove(parsed);

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

function createChessMove(phrase){

    var chessMove = '';
    for(const word of phrase){
        chessMove += extractCharacter(word);
    }
    return chessMove;
}

// the create move function for when only coordinates were acceptable.
// function createChessMove(phrase){

//     var chessMove = [];
//     var coordinate = '';
//     for(const word of phrase){
//         coordinate += extractCharacter(word);
        
//         if (coordinate.length == 2){
           
//             chessMove.push(coordinate);

//             if(coordinate.match(/[a-h][1-8]/)){
//                 coordinate = '';
//             }
            
//             else {
//                 console.log("bad square interpreted: " + chessMove);
//                 return null;
//             }
//         }
//     }

//     return chessMove;
// }

function extractCharacter(word){

    var numberPattern = /\d/;

    //All this logic is to try and figure out if:
    //the word is a key chess word (or is supposed to be), OR:
    //if the word is a spelled out version of a number, 
    //and to then convert it to it's decimal representation (still as a string though)
    if(word.match(numberPattern) == null){

        if(chessKeyWords.has(word)){
            return chessKeyWords.get(word);
        }

        if(fuzzyKeyWords.has(word)){
            return fuzzyKeyWords.get(word);
        }
        //if the word falls within our problem set, return the correct character
        /**
         * TODO: currently behaves as if the only conflicting words are supposed to be numbers;
         * could not handle a word replacing a word correctly.
         */
        if (problemWords.includes(word)) {
            return solutionWords[problemWords.indexOf(word)];
        }
        else {
            for(var i = 0; i < textNumbers.length; i++){
                if (word.valueOf() === textNumbers[i].valueOf()){
                    return (i + 1).toString();
                }
            }
        }
    }

    //if here: get first letter of word (or if word is a digit, get digit)
    return word.charAt(0);

}

function replacePunctuation(word){

    return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');

}

function printReady(){
    console.log(" the number of 'ready' elements is: " + document.getElementsByClassName('ready').length);
}
// document.addEventListener('DOMContentLoaded', (event) => {
//     //the event occurred
//     console.log(document.getElementsByClassName('ready').length);
//   });
      
function submitMove(){

    if(resultMove.length != 0){
        
        inputBox.value = resultMove;
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
