// chrome.commands.onCommand.addListener(function(command) {
//     console.log('Command:', command);

//     const command_entered = command;
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, { command_entered });
//     });


// });

chrome.runtime.onInstalled.addListener((details)=>{
    console.log("The extension has been installed!");

    var speech_to_text_Lichess_fuzzy_words = {
        "night": "knight",
        "brooke": "rook",
        "kapture": "capture",
        "clean": "queen",
    
        "won": "1",
        "to": "2",
        "too": "2",
        "ii": "2",
    
        "for": "4",
        "force": "4",
        "ford": "4",
        "iv": "4",
    
        "v": "5",
    
        "sticks": "6",
        "stix": "6",
        "sex": "6",
        "hate": "8",
        "ate": "8"
            
    };

    chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words);
    
});
