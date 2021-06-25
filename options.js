
const _GENERATE_TOKEN_URL = 'https://lichess.org/account/oauth/token/create?scopes[]=board:play&description=board_play_token';

var trouble_input = document.querySelector('#trouble_input');
var correct_input = document.querySelector('#correct_input');
var submit_button = document.querySelector('#submit');
var delete_button = document.querySelector('#delete');
var update_message = document.querySelector('#update_message');
var refresh_message = document.querySelector('#refresh_message');
var delete_input = document.querySelector('#delete_input');
let generateButton = document.getElementById('generate_token_button');

var word_replacement_list;
var replacement_word_keys;

chrome.storage.local.get(word_replacement_list, function(result){
    word_replacement_list = result;
    replacement_word_keys = Object.keys(word_replacement_list);
    console.log(replacement_word_keys);
    addTableRows(replacement_word_keys);

});

var ignoreList = ['last_command', '__toggle'];

submit_button.addEventListener("click", submitPhrase);
delete_button.addEventListener("click", deleteWord);
generateButton.addEventListener('click', generateToken);

function addTableRows(array) {
    var table = document.getElementById('replacement_table');
    
    for (var i = 0; i < array.length; i++) {
        
        //check to make sure the entry is not an option. Should definitely 
        //change storage management so that this can't happen!
        if(ignoreList.includes(array[i])){
            continue;
        } 
        // Create the table row:
        var item = document.createElement('tr');

        // add the problematic word and it's replacement phrase:
        var problem_col = document.createElement('td');
        problem_col.innerHTML = array[i];
        var correct_col = document.createElement('td');
        correct_col.innerHTML = word_replacement_list[array[i]];
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
    var phrase_updated = word_replacement_list.hasOwnProperty(trouble_word);
    //TODO: vet the input phrase for formatting correctness

    if(correct_phrase = checkProposedPhrase(correct_phrase)){
    
        console.log("checkProposedPhrase returned true!");
        word_replacement_list[trouble_word] = correct_phrase;
        chrome.storage.local.set(word_replacement_list);

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

    if(word_replacement_list.hasOwnProperty(word_to_delete)){

        delete word_replacement_list[word_to_delete];
        console.log(word_replacement_list);
        console.log(word_replacement_list[word_to_delete]);
        // chrome.storage.local.remove(['word_replacement_list'], function(){
        //     var error = chrome.runtime.lastError;
        //        if (error) {
        //            console.error(error);
        //        }
        //     chrome.storage.local.set(word_replacement_list);
            
        //     });
        chrome.storage.local.clear(function(){
            chrome.storage.local.set(word_replacement_list);
        });


        refresh_message.textContent = "Replacement table updated, refresh page to see changes!";
        delete_input.value = '';

        update_message.textContent = "Word removed: " + word_to_delete + " will no longer be replaced.";

    }
}

function generateToken(){
    window.open(_GENERATE_TOKEN_URL, '_blank');
}
