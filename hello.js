console.log("This is on Lichess!");

console.log(document.getElementsByClassName('site-title').length);


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


new MutationObserver(() => {
    if(document.getElementsByClassName('ready').length > 0)
        printReady();
}).observe(document, {subtree: true, childList: true});


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

    chrome.storage.sync.set({last_command: command}, function(){

        //when set runs
        console.log("value is set");

        chrome.storage.sync.get(['last_command'], function(result){
            console.log(result);
        });
    });
    var resultString = '';
    command = replacePunctuation(command);

    var parsed = command.split(' ');
    console.log('Voice Input: ' + command + '.');
    console.log("parsed = " + parsed);

    for(var i = 0; i < parsed.length; i++){
        resultString += extractCharacter(parsed[i]);
    }
    console.log("result = " + resultString);
};

recognition.onspeechend = function() {
    recognition.stop();
};

recognition.onerror = function(event) {
    message.textContent = 'Error occurred in recognition: ' + event.error;
}        


function extractCharacter(word){

    var numberPattern = /\d/;
    word = word.toLowerCase();

    //All this logic is to try and figure out if the word is a spelled out version of a number, and to then convert it to it's decimal representation (still as a string though)
    if(word.match(numberPattern) == null){


        //if the word falls within our "two" set
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
      

