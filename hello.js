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

var textNumbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
var problemWords = ['won', 'to', 'too', 'for', 'v', 'sex', 'hate', 'ate'];
var solutionWords = ['1', '2', '2', '4', '5', '6', '8', '8'];

var inputBox;
var resultMove = [];
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


    /**
     * TODO: save the values from the onresult function to a global variable. Take out the
     * processing from this function, and have it fire on the 2nd keyboard event.
     */
    var last = event.results.length - 1;
    var command = event.results[last][0].transcript;
    command = command.toLowerCase();

    //save the last phrase heard, to show the user in pop_up window
    chrome.storage.sync.set({last_command: command}, function(){

        chrome.storage.sync.get(['last_command'], function(result){
            console.log(result);
        });
    });
    command = replacePunctuation(command);

    var parsed = command.split(' ');
    console.log('Voice Input: ' + command + '.');
    console.log("parsed = " + parsed);

    // for(var i = 0; i < parsed.length; i++){
    //     resultMove += extractCharacter(parsed[i]);
    // }

    resultMove = createChessMove(parsed);

    if(resultMove == null){
        console.log("failed to create valid chess move.");
        return;
    }
    console.log("result = " + resultMove.toString());

    // if(resultMove.match(/[a-h][1-8][a-h][1-8]/)){
    //     console.log("result is in the correct format!");
    // }

    // else console.log("result did not match regex.");

    //input resulting move into Lichess text box
};

recognition.onspeechend = function() {
    recognition.stop();
};

recognition.onerror = function(event) {
    message.textContent = 'Error occurred in recognition: ' + event.error;
}        

function createChessMove(phrase){

    var chessMove = [];
    var coordinate = '';
    for(const word of phrase){
        coordinate += extractCharacter(word);
        
        if (coordinate.length == 2){
           
            chessMove.push(coordinate);

            if(coordinate.match(/[a-h][1-8]/)){
                coordinate = '';
            }
            
            else {
                console.log("bad square interpreted: " + chessMove);
                return null;
            }
        }
    }

    return chessMove;
}

function extractCharacter(word){

    var numberPattern = /\d/;

    //All this logic is to try and figure out if the word is a spelled out version of a number, and to then convert it to it's decimal representation (still as a string though)
    if(word.match(numberPattern) == null){


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
      
async function submitMove(){

    if(resultMove.length != 0){
        for(const coordinate of resultMove){
        
            inputBox.value = coordinate;
            // inputBox.dispatchEvent(ke);
            await new Promise(r => setTimeout(r, 20));
    
        }

        resultMove = [];
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
