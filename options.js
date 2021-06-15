

var trouble_input = document.querySelector('#trouble_input');
var correct_input = document.querySelector('#correct_input');
var submit_button = document.querySelector('#submit');
var delete_button = document.querySelector('#delete');
var update_message = document.querySelector('#update_message');
var refresh_message = document.querySelector('#refresh_message');
var delete_input = document.querySelector('#delete_input');
var speech_to_text_Lichess_fuzzy_words;
var fuzzyWordKeys;

chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
    speech_to_text_Lichess_fuzzy_words = result;
    fuzzyWordKeys = Object.keys(speech_to_text_Lichess_fuzzy_words);
    console.log(fuzzyWordKeys);
    addTableRows(fuzzyWordKeys);

});

submit_button.addEventListener("click", submitPhrase);
delete_button.addEventListener("click", deleteWord);
function addTableRows(array) {
    var table = document.getElementById('replacement_table');
    
    for (var i = 0; i < array.length; i++) {
        // Create the table row:
        var item = document.createElement('tr');

        // add the problematic word and it's replacement phrase:
        var problem_col = document.createElement('td');
        problem_col.innerHTML = array[i];
        var correct_col = document.createElement('td');
        correct_col.innerHTML = speech_to_text_Lichess_fuzzy_words[array[i]];
        // var edit_col = document.createElement('td');
        // var edit_button = document.createElement('button');
        // var delete_button = document.createElement('button');
        // edit_button.innerHTML = "edit...";
        // delete_button.innerHTML = "X";
        // edit_col.appendChild(edit_button);
        // edit_col.appendChild(delete_button);
        
        item.appendChild(problem_col);
        item.appendChild(correct_col);
        // item.appendChild(edit_col);
        // Add it to the table:
        table.appendChild(item);
    }

    // Finally, return the constructed list:
    return table;
}

function submitPhrase(){
    
    if(trouble_input.value === '' || correct_input.value === '') return;

    console.log("replace " + trouble_input.value + " with: " + correct_input.value);
    var trouble_word = trouble_input.value;
    var correct_phrase = correct_input.value;
    var phrase_updated = speech_to_text_Lichess_fuzzy_words.hasOwnProperty(trouble_word);
    //TODO: vet the input phrase for formatting correctness

    if(correct_phrase = checkProposedPhrase(correct_phrase)){
    
        console.log("checkProposedPhrase returned true!");
        speech_to_text_Lichess_fuzzy_words[trouble_word] = correct_phrase;
        chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words);

        if (phrase_updated){
            update_message.textContent = "Word updated: " + trouble_word + " will now be interpreted as: " + correct_phrase;
        }

        else update_message.textContent = "Word added: " + trouble_word + " will now be interpreted as: " + correct_phrase;

        refresh_message.textContent = "Replacement table updated, refresh page to see changes!";
        correct_input.value = '';
        trouble_input.value = '';

    }
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

function deleteWord(){

    var word_to_delete = delete_input.value;
    if (word_to_delete == null) return;

    if(speech_to_text_Lichess_fuzzy_words.hasOwnProperty(word_to_delete)){

        delete speech_to_text_Lichess_fuzzy_words[word_to_delete];
        console.log(speech_to_text_Lichess_fuzzy_words);
        console.log(speech_to_text_Lichess_fuzzy_words[word_to_delete]);
        // chrome.storage.local.remove(['speech_to_text_Lichess_fuzzy_words'], function(){
        //     var error = chrome.runtime.lastError;
        //        if (error) {
        //            console.error(error);
        //        }
        //     chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words);
            
        //     });
        chrome.storage.local.clear(function(){
            chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words);
        });


        refresh_message.textContent = "Replacement table updated, refresh page to see changes!";
        delete_input.value = '';

        update_message.textContent = "Word removed: " + word_to_delete + " will no longer be replaced.";

    }
}