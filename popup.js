
var command = document.querySelector('#command');
var trouble_input = document.querySelector('#trouble_input');
var correct_input = document.querySelector('#correct_input');
var submit = document.querySelector('#submit');
var manage = document.querySelector('#manage');
var display_result = document.querySelector('#display_result');
var hold_radio = document.querySelector('#hold');
var toggle_radio = document.querySelector('#toggle');

var speech_to_text_Lichess_fuzzy_words;
var TOGGLE_LISTEN;
chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
    speech_to_text_Lichess_fuzzy_words = result;

});



chrome.storage.local.get(['last_command'], function(result){

    var last_command = result['last_command'];
    if(last_command == undefined){
        last_command = 'nothing yet!'
    }
    command.textContent = "Speech Recognition heard: " + last_command;
});

chrome.storage.local.get(TOGGLE_LISTEN, function(result){
    TOGGLE_LISTEN = result;

    if (TOGGLE_LISTEN['__toggle']) toggle_radio.checked = true;
    else hold_radio.checked = true;

});

hold_radio.addEventListener("change", function(event){
    console.log("toggle off");
    TOGGLE_LISTEN['__toggle'] = false;
    chrome.storage.local.set(TOGGLE_LISTEN);
});

toggle_radio.addEventListener("change", function(event){
    console.log("toggle on");
    TOGGLE_LISTEN['__toggle'] = true;
    chrome.storage.local.set(TOGGLE_LISTEN);
});
submit.addEventListener("click", submitPhrase);
manage.addEventListener("click", managePhrases);

function submitPhrase(){
    
    if(trouble_input.value === '' || correct_input.value === '') return;

    console.log("replace " + trouble_input.value + " with: " + correct_input.value);
    var trouble_word = trouble_input.value;

    if (speech_to_text_Lichess_fuzzy_words.hasOwnProperty(trouble_word)){
        console.log(trouble_word + " is already a replaced word...");
        display_result.textContent = trouble_word + " is already replaced; manage your replaced words to change.";
        return;
    }

    var correct_phrase = correct_input.value;

    //TODO: vet the input phrase for formatting correctness

    if(correct_phrase = checkProposedPhrase(correct_phrase)){

        speech_to_text_Lichess_fuzzy_words[trouble_word] = correct_phrase;
        chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words);

        display_result.textContent = trouble_word + " will now be reinterpreted as: " + correct_phrase;
        correct_input.value = '';
        trouble_input.value = '';

    }
}

function managePhrases(){
    console.log("popup fuzzy words:");
    console.log(speech_to_text_Lichess_fuzzy_words);

    chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
        console.log("local fuzzy words:");
        console.log(result);
    });
    
    chrome.runtime.openOptionsPage();
}

function checkProposedPhrase(phrase){

    if (/[,;:"<>.'?\-]/.test(phrase)) {
        correct_input.value = '';
        display_result.textContent = "Replacement phrase must not include punctuation. Use space ' ' to seperate words."
        return false;
    }
    
    //would not catch all possible hanging spaces
    else if (phrase.endsWith(' ')){
        return phrase.subString(0, phrase.length-1);
    }

    return phrase;
}