

var speech_to_text_Lichess_fuzzy_words;
var fuzzyWordKeys;
chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words, function(result){
    speech_to_text_Lichess_fuzzy_words = result;
    fuzzyWordKeys = Object.keys(speech_to_text_Lichess_fuzzy_words);
    console.log(fuzzyWordKeys);
    document.getElementById('foo').appendChild(makeUL(fuzzyWordKeys));

});


// Add the contents of options[0] to #foo:


function makeUL(array) {
    // Create the list element:
    var list = document.createElement('ul');

    for (var i = 0; i < array.length; i++) {
        // Create the list item:
        var item = document.createElement('li');

        // Set its contents:
        item.appendChild(document.createTextNode(array[i]));
        item.appendChild(document.createTextNode(speech_to_text_Lichess_fuzzy_words[array[i]]));
        
        // Add it to the list:
        list.appendChild(item);
    }

    // Finally, return the constructed list:
    return list;
}

