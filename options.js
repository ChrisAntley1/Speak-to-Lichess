

const _GENERATE_TOKEN_URL = 'https://lichess.org/account/oauth/token/create?scopes[]=board:play&description=board_play_token';
const VALID_TOKEN_MESSAGE = "Current token is valid for Lichess user ";
const NO_TOKEN_MESSAGE = "No token stored."

let troubleInput = document.getElementById('trouble_input');
let correctInput = document.getElementById('correct_input');
let updateMessage = document.getElementById('update_message');
let deleteInput = document.getElementById('delete_input');
let generateButton = document.getElementById('generate_token_button');
let tokenInput = document.getElementById('board_token_input');
let tokenMessage = document.getElementById('token_message');
let tokenStatus = document.getElementById('token_status');
let statusImage = document.getElementById('status_image');
let displayMessage = document.getElementById('display_message');
let searchInput = document.getElementById('search_input');
let table = document.getElementById('replacement_table');
let tableBody = document.getElementById('table_body');
let newWordForm = document.getElementById('new_word_form');
let deleteWordForm = document.getElementById('delete_form');
let tokenForm = document.getElementById('token_form');
let deleteTokenForm = document.getElementById('delete_token_form');

let word_replacement_list;
let replacement_word_keys;
let board_api_token;

//ignore list should no longer be needed
let ignoreList = ['last_command', '__toggle', '__board_api_token'];

getAndDrawTable();

chrome.storage.local.get(['__board_api_token'], function(result){

    if(!result.hasOwnProperty('__board_api_token')){
        tokenStatus.innerHTML = NO_TOKEN_MESSAGE;
    }

    else {
        testToken(result['__board_api_token'], false);
    }
});

newWordForm.addEventListener('submit', submitPhrase);
deleteWordForm.addEventListener('submit', deleteWord);
tokenForm.addEventListener('submit', submitToken);
deleteTokenForm.addEventListener('submit', deleteToken);
generateButton.addEventListener('click', generateToken);
searchInput.addEventListener('keyup', filterBySearch);


function getAndDrawTable(){
    
    chrome.storage.local.get(['word_replacement_list'], function(result){
        word_replacement_list = result['word_replacement_list'];
        replacement_word_keys = Object.keys(word_replacement_list);
        console.log(replacement_word_keys);
        addTableRows(replacement_word_keys);
    });    
}

function addTableRows(array){
    
    let newTableBody = document.createElement('tbody');

    for (let i = 0; i < array.length; i++) {
        
        if(ignoreList.includes(array[i])){
            continue;
        } 
        // Create the table row:
        let item = document.createElement('tr');
        item.id = array[i]+word_replacement_list[array[i]];

        // add the problematic word and it's replacement phrase:
        let problem_col = document.createElement('td');
        let correct_col = document.createElement('td');

        problem_col.innerHTML = array[i];
        correct_col.innerHTML = word_replacement_list[array[i]];
        
        item.appendChild(problem_col);
        item.appendChild(correct_col);

        // Add it to the table:
        newTableBody.appendChild(item);
    }

    table.replaceChild(newTableBody, tableBody);
    tableBody = newTableBody;
    // Finally, return the constructed list:

    //...eh?
}

function filterBySearch(){

    if (document.activeElement === searchInput){
        
        let searchText = searchInput.value;
        for(key of replacement_word_keys){
            
            if(ignoreList.includes(key))
                continue; 

            let tableRow = document.getElementById(key+word_replacement_list[key]);

            if(searchText == null || searchText == undefined || searchText.length == 0)
                tableRow.style.display = null;
            
            else if(key.includes(searchText))
                tableRow.style.display = null;

            else if(word_replacement_list[key].includes(searchText))
                tableRow.style.display = null;
            
            else tableRow.style.display = "none";
            
        }
    }
}
function submitPhrase(e){
    
    e.preventDefault();
    let trouble_word = troubleInput.value;
    let correct_phrase = correctInput.value; 
    if(trouble_word == null || trouble_word == undefined || trouble_word.length == 0) return;
    if(correct_phrase == null || correct_phrase == undefined || correct_phrase.length == 0) return;
    
    if(!trouble_word.match(/^[a-z0-9]+$/i)){
        troubleInput.value = '';
        displayMessage.innerHTML = "Replacement word must be alphanumeric."
        return;
    }

    if(trouble_word.includes(' ')){
        troubleInput.value = '';
        displayMessage.innerHTML = "Replacement word must be a single word and contain no spaces."
        return;
    }
    let phrase_updated = word_replacement_list.hasOwnProperty(trouble_word);

    if(correct_phrase = checkProposedPhrase(correct_phrase)){
    
        word_replacement_list[trouble_word] = correct_phrase;
        chrome.storage.local.set({'word_replacement_list': word_replacement_list});

        getAndDrawTable();

        if (phrase_updated){
            updateMessage.textContent = "Word updated: '" + trouble_word + "' will now be interpreted as: '" + correct_phrase +"'";
        }

        else updateMessage.textContent = "Word added: '" + trouble_word + "' will now be interpreted as: '" + correct_phrase +"'";

        correctInput.value = '';
        troubleInput.value = '';
    }
}

function checkProposedPhrase(phrase){

    if (/[,;:"<>.'?\-]/.test(phrase)) {
        correctInput.value = '';
        displayMessage.innerHTML = "Replacement phrase cannot not include punctuation. Use space ' ' to seperate words."
        return false;
    }
    
    //would not catch all possible hanging spaces
    else if (phrase.endsWith(' ')){
        return phrase.subString(0, phrase.length-1);
    }

    return phrase;
}

function deleteWord(e){
    e.preventDefault();

    let word_to_delete = deleteInput.value;
    if(word_to_delete == null || word_to_delete == undefined || word_to_delete.length == 0) return;

    if(word_replacement_list.hasOwnProperty(word_to_delete)){

        delete word_replacement_list[word_to_delete];
        chrome.storage.local.set({'word_replacement_list': word_replacement_list});

        getAndDrawTable();
        updateMessage.textContent = word_to_delete + " will no longer be replaced.";
    }

    else updateMessage.textContent = word_to_delete + " is not a word that is currently being replaced.";

    deleteInput.value = '';

}

function generateToken(){
    window.open(_GENERATE_TOKEN_URL, '_blank');
    tokenInput.focus();
}

async function submitToken(e){

    e.preventDefault();

    let token = tokenInput.value;
    if (checkTokenFormat(token)){
        console.log("shouldnt be here");
        testToken(token, true);
    } 

    tokenInput.value = '';
}

function checkTokenFormat(token){
    if(token == null || token == undefined || token.length == 0){
        tokenMessage.innerHTML = "No token entered.";
        return false;
    }

    tokenMessage.innerHTML = 'Checking with Lichess...';
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

function deleteToken(e){
    e.preventDefault();
    chrome.storage.local.remove('__board_api_token');
    
    tokenMessage.innerHTML = 'Removed token from local storage (if one existed). You should alse delete this token on Lichess: https://lichess.org/account/oauth/token';
    tokenStatus.innerHTML = NO_TOKEN_MESSAGE;
    statusImage.src = "images/redChess512.png";
}

