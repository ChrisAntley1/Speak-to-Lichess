
var command = document.querySelector('#command');
var trouble_phrase = document.querySelector('#trouble_phrase');
var correct_phrase = document.querySelector('#correct_phrase');
var submit = document.querySelector('#submit');
var manage = document.querySelector('#manage');

var speech_to_text_Lichess_fuzzy_words_2;
chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words_2, function(result){
    speech_to_text_Lichess_fuzzy_words_2 = result;
});

chrome.storage.local.get(['last_command'], function(result){
    command.textContent = "Speech Recognition heard: " + result['last_command'];
});


submit.addEventListener("click", submitPhrase);
manage.addEventListener("click", managePhrases);

function submitPhrase(){
    
    console.log("replace " + trouble_phrase.value + " with: " + correct_phrase.value);
    var trouble = trouble_phrase.value;

    if (speech_to_text_Lichess_fuzzy_words_2.hasOwnProperty(trouble)){
        console.log(trouble + " is already a replaced word...");
        return;
    }

    var correct = correct_phrase.value;

    speech_to_text_Lichess_fuzzy_words_2[trouble] = correct;
    chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words_2);
}

function managePhrases(){
    console.log("popup fuzzy words:");
    console.log(speech_to_text_Lichess_fuzzy_words_2);

    chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words_2, function(result){
        console.log("local fuzzy words:");
        console.log(result);
    });
    
}