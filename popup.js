
var command = document.querySelector('#command');
var trouble_phrase = document.querySelector('#trouble_phrase');
var correct_phrase = document.querySelector('#correct_phrase');
var submit = document.querySelector('#submit');
var manage = document.querySelector('#manage');

chrome.storage.sync.get(['last_command'], function(result){
    command.textContent = "Speech Recognition heard: " + result['last_command'];
});


submit.addEventListener("click", submitPhrase);
manage.addEventListener("click", managePhrases);

function submitPhrase(){
    
    console.log("replace " + trouble_phrase.value + " with: " + correct_phrase.value);

}

function managePhrases(){
    console.log("managePhrases pressed");
}