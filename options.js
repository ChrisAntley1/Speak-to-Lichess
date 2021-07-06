

const _GENERATE_TOKEN_URL = 'https://lichess.org/account/oauth/token/create?scopes[]=board:play&description=board_play_token';
const VALID_TOKEN_MESSAGE = "Current token is valid for Lichess user ";
const NO_TOKEN_MESSAGE = "No token stored."

let trouble_input = document.querySelector('#trouble_input');
let correct_input = document.querySelector('#correct_input');
let submit_button = document.querySelector('#submit');
let delete_button = document.querySelector('#delete');
let update_message = document.querySelector('#update_message');
let refresh_message = document.querySelector('#refresh_message');
let delete_input = document.querySelector('#delete_input');
let generateButton = document.getElementById('generate_token_button');
let tokenInput = document.getElementById('board_token_input');
let tokenButton = document.getElementById('submit_token_button');
let tokenMessage = document.getElementById('token_message');
let tokenStatus = document.getElementById('token_status');
let statusImage = document.getElementById('status_image');
let displayMessage = document.getElementById('display_message');
let searchInput = document.getElementById('search_input');

var word_replacement_list;
var replacement_word_keys;
var board_api_token;


chrome.storage.local.get(word_replacement_list, function(result){
    word_replacement_list = result;
    replacement_word_keys = Object.keys(word_replacement_list);
    console.log(replacement_word_keys);
    addTableRows(replacement_word_keys);

});

chrome.storage.local.get(['__board_api_token'], function(result){

    if(!result.hasOwnProperty('__board_api_token')){
        tokenStatus.innerHTML = NO_TOKEN_MESSAGE;
    }

    else {
        testToken(result['__board_api_token'], false);
    }
});
var ignoreList = ['last_command', '__toggle', '__board_api_token'];

submit_button.addEventListener('click', submitPhrase);
delete_button.addEventListener('click', deleteWord);
generateButton.addEventListener('click', generateToken);
searchInput.addEventListener('keyup', filterBySearch);

tokenButton.addEventListener('click', submitToken);
tokenInput.addEventListener('keyup', function(event){
    if (event.key === 'Enter') submitToken();
});

function addTableRows(array) {
    var table = document.getElementById('replacement_table');
    
    for (var i = 0; i < array.length; i++) {
        
        if(ignoreList.includes(array[i])){
            continue;
        } 
        // Create the table row:
        var item = document.createElement('tr');
        item.id = array[i]+word_replacement_list[array[i]];
        // add the problematic word and it's replacement phrase:
        var problem_col = document.createElement('td');
        problem_col.innerHTML = array[i];
        var correct_col = document.createElement('td');
        correct_col.innerHTML = word_replacement_list[array[i]];
        
        item.appendChild(problem_col);
        item.appendChild(correct_col);

        // Add it to the table:
        table.appendChild(item);
    }

    // Finally, return the constructed list:
    return table;
}

function filterBySearch(){

    if (document.activeElement === searchInput){
        
        let searchText = searchInput.value;
        for(key of replacement_word_keys){
            
            if(ignoreList.includes(key)){
                continue;
            } 

            let tableRow = document.getElementById(key+word_replacement_list[key]);

            if(searchText == null || searchText == undefined || searchText.length == 0){
                tableRow.style.display = null;
            }
            else if(key.includes(searchText)){
                tableRow.style.display = null;
            }

            else if(word_replacement_list[key].includes(searchText)){
                tableRow.style.display = null;
            }
            
            else {
                tableRow.style.display = "none";
            }
        }
    }
}
function submitPhrase(){
    
    var trouble_word = trouble_input.value;
    var correct_phrase = correct_input.value; 
    if(trouble_word == null || trouble_word == undefined || trouble_word.length == 0) return;
    if(correct_phrase == null || correct_phrase == undefined || correct_phrase.length == 0) return;
    
    if(!trouble_word.match(/^[a-z0-9]+$/i)){
        trouble_input.value = '';
        displayMessage.innerHTML = "Replacement word must be alphanumeric."
        return;
    }

    if(trouble_word.includes(' ')){
        trouble_input.value = '';
        displayMessage.innerHTML = "Replacement word must be a single word and contain no spaces."
        return;

    }
    console.log("replace " + trouble_word + " with: " + correct_phrase);

    var phrase_updated = word_replacement_list.hasOwnProperty(trouble_word);

    if(correct_phrase = checkProposedPhrase(correct_phrase)){
    
        console.log("checkProposedPhrase returned true!");
        word_replacement_list[trouble_word] = correct_phrase;
        chrome.storage.local.set(word_replacement_list);

        if (phrase_updated){
            update_message.textContent = "Word updated: '" + trouble_word + "' will now be interpreted as: '" + correct_phrase +"'";
        }

        else update_message.textContent = "Word added: '" + trouble_word + "' will now be interpreted as: '" + correct_phrase +"'";

        refresh_message.textContent = "Replacement table updated, refresh page to see changes!";
        correct_input.value = '';
        trouble_input.value = '';

    }
}

function checkProposedPhrase(phrase){

    if (/[,;:"<>.'?\-]/.test(phrase)) {
        correct_input.value = '';
        displayMessage.innerHTML = "Replacement phrase cannot not include punctuation. Use space ' ' to seperate words."
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
    if(word_to_delete == null || word_to_delete == undefined || word_to_delete.length == 0) return;

    if(word_replacement_list.hasOwnProperty(word_to_delete)){

        delete word_replacement_list[word_to_delete];
        console.log(word_replacement_list);
        console.log(word_replacement_list[word_to_delete]);
        chrome.storage.local.clear(function(){
            chrome.storage.local.set(word_replacement_list);
        });


        refresh_message.textContent = "Replacement table updated, refresh page to see changes!";

        update_message.textContent = "Word removed: " + word_to_delete + " will no longer be replaced.";

    }

    else {
        update_message.textContent = word_to_delete + " is already not being replaced.";
    }

    delete_input.value = '';

}

function generateToken(){
    window.open(_GENERATE_TOKEN_URL, '_blank');
}

async function submitToken(){
    let token = tokenInput.value;
    if (checkTokenFormat(token)){

        testToken(token, true);
    } 

    tokenInput.value = '';
}

function checkTokenFormat(token){
    if(token == null || token == undefined || token.length == 0){
        tokenMessage.innerHTML = "No token entered.";
        return false;
    }

    if(token.length != 16){
        tokenMessage.innerHTML = "Invalid token.";
        return false;
    }

    tokenMessage.innerHTML = 'Format appears valid, checking with Lichess...';
    return true;
}

function storeToken(token){
    chrome.storage.local.set({__board_api_token: token}, function(){
        chrome.storage.local.get(['__board_api_token'], function(result){
            console.log(result);
        });
    });
}

async function testToken(token, isNewToken){
    tokenStatus.innerHTML = "Checking Token...";
    fetch('https://lichess.org/api/account', {
    
        headers: {
            'Authorization': 'Bearer ' + token
        }
    
        })
        .then(res => res.json())
        .then(function(res){

            if(res.hasOwnProperty('error')){
                if(isNewToken) tokenMessage.innerHTML = "Fetch failed: " + res['error'] + ". Try creating a new token.";
                else tokenStatus.innerHTML = "Fetch failed: " + res['error'] + ". Try creating a new token.";
                
            }
            else {
                if(isNewToken){
                    storeToken(token);
                    tokenMessage.innerHTML = 'Success!';
                } 
                tokenStatus.innerHTML = VALID_TOKEN_MESSAGE + res['username'] +".";
                statusImage.src = "images/greenChess512.png";
            }
        });
}