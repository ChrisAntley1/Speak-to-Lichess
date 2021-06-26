
var command = document.querySelector('#command');
var trouble_input = document.querySelector('#trouble_input');
var correct_input = document.querySelector('#correct_input');
var submit = document.querySelector('#submit');
var manage = document.querySelector('#manage');
var displayResult = document.querySelector('#display_result');
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
    command.innerHTML = last_command;
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
manage.addEventListener("click", openOptions);

function submitPhrase(){
    

    var trouble_word = trouble_input.value;
    var correct_phrase = correct_input.value; 
    if(trouble_word == null || trouble_word == undefined || trouble_word.length == 0) return;
    if(correct_phrase == null || correct_phrase == undefined || correct_phrase.length == 0) return;

    console.log(" Attempting to replace " + trouble_word + " with: " + correct_phrase);

    if(!trouble_word.match(/^[a-z0-9]+$/i)){
        trouble_input.value = '';
        displayResult.innerHTML = "Replacement word must be alphanumeric."
        return;
    }

    if(trouble_word.includes(' ')){
        trouble_input.value = '';
        displayResult.innerHTML = "Replacement word must be a single word and contain no spaces."
        return;

    }

    if (speech_to_text_Lichess_fuzzy_words.hasOwnProperty(trouble_word)){
        console.log(trouble_word + " is already a replaced word...");
        displayResult.innerHTML = trouble_word + " is already replaced; manage your replaced words to change.";
        return;
    }

    //TODO: vet the input phrase for formatting correctness

    if(correct_phrase = checkProposedPhrase(correct_phrase)){

        speech_to_text_Lichess_fuzzy_words[trouble_word] = correct_phrase;
        chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words);

        displayResult.innerHTML = trouble_word + " will now be reinterpreted as: " + correct_phrase;
        correct_input.value = '';
        trouble_input.value = '';

    }
}

function openOptions(){
    // console.log("popup replaced words:");
    // console.log(speech_to_text_Lichess_fuzzy_words);

    // chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
    //     console.log("local replaced words:");
    //     console.log(result);
    // });
    
    chrome.runtime.openOptionsPage();
}

function checkProposedPhrase(phrase){

    if (/[,;:"<>.'?\-]/.test(phrase)) {
        correct_input.value = '';
        displayResult.innerHTML = "Replacement phrase must not include punctuation. Use space ' ' to seperate words."
        return false;
    }
    
    //would not catch all possible hanging spaces
    else if (phrase.endsWith(' ')){
        return phrase.subString(0, phrase.length-1);
    }

    return phrase;
}