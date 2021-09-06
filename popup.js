
let command = document.getElementById('command');
let trouble_input = document.getElementById('trouble_input');
let correct_input = document.getElementById('correct_input');
let submit = document.getElementById('submit');
let manage = document.getElementById('manage');
let displayResult = document.getElementById('display_result');
let hold_radio = document.getElementById('hold');
let toggle_radio = document.getElementById('toggle');
let replaceForm = document.getElementById('replace_form');
let word_replacement_list;
let toggle_listen;
let last_command;

accessStorage();
createEventListeners();
trouble_input.focus();


function accessStorage(){

    chrome.storage.local.get(['word_replacement_list'], function(result){
        word_replacement_list = result['word_replacement_list'];
    });
    
    chrome.storage.local.get(['last_command'], function(result){
    
        last_command = result['last_command'];
        if(last_command == undefined){
            last_command = 'nothing yet!'
        }
        command.innerHTML = last_command;
    });
    
    chrome.storage.local.get(['__toggle'], function(result){
        toggle_listen = result['__toggle'];
    
        if (toggle_listen) toggle_radio.checked = true;
        else hold_radio.checked = true;
    });    
}

function createEventListeners(){

    hold_radio.addEventListener("change", function(event){
        console.log("toggle off");
        toggle_listen = false;
        chrome.storage.local.set({'__toggle': toggle_listen});
    });
    
    toggle_radio.addEventListener("change", function(event){
        console.log("toggle on");
        toggle_listen = true;
        chrome.storage.local.set({'__toggle': toggle_listen});
    });
    
    replaceForm.addEventListener("submit", submitPhrase);
    manage.addEventListener("click", openOptions);    
}
function submitPhrase(e){

    e.preventDefault();
    let trouble_word = trouble_input.value;
    let correct_phrase = correct_input.value; 
    if(trouble_word == null || trouble_word == undefined || trouble_word.length == 0) return;
    if(correct_phrase == null || correct_phrase == undefined || correct_phrase.length == 0) return;

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
    let phrase_updated = word_replacement_list.hasOwnProperty(trouble_word);

    if(correct_phrase = checkProposedPhrase(correct_phrase)){

        word_replacement_list[trouble_word] = correct_phrase;
        chrome.storage.local.set({'word_replacement_list': word_replacement_list});

        let updateOrAdd = (phrase_updated) ? 'Word updated: ' : 'Word added: ';

        displayResult.innerHTML = updateOrAdd + trouble_word + " will now be reinterpreted as: " + correct_phrase;
        
        correct_input.value = '';
        trouble_input.value = '';

    }
}

function openOptions(){
    
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