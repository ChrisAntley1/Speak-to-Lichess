
var command = document.querySelector('#command');
var trouble_input = document.querySelector('#trouble_input');
var correct_input = document.querySelector('#correct_input');
var submit = document.querySelector('#submit');
var manage = document.querySelector('#manage');
var display_result = document.querySelector('#display_result');
var speech_to_text_Lichess_fuzzy_words;

chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
    speech_to_text_Lichess_fuzzy_words = result;
});

chrome.storage.local.get(['last_command'], function(result){
    command.textContent = "Speech Recognition heard: " + result['last_command'];
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