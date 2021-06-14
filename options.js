

var speech_to_text_Lichess_fuzzy_words;
var fuzzyWordKeys;
chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
    speech_to_text_Lichess_fuzzy_words = result;
    fuzzyWordKeys = Object.keys(speech_to_text_Lichess_fuzzy_words);
    console.log(fuzzyWordKeys);
    addTableRows(fuzzyWordKeys);

});


// Add the contents of options[0] to #foo:


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
        var edit_col = document.createElement('td');
        var edit_button = document.createElement('button');
        edit_button.innerHTML = "edit...";
        edit_col.appendChild(edit_button);
        item.appendChild(problem_col);
        item.appendChild(correct_col);
        item.appendChild(edit_col);
        // Add it to the table:
        table.appendChild(item);
    }

    // Finally, return the constructed list:
    return table;
}

