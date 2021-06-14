chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);

    const command_entered = command;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command_entered });
    });


  });

chrome.runtime.onInstalled.addListener((details)=>{
    console.log("The extension has been installed!");

    var speech_to_text_Lichess_fuzzy_words_2 = {};
    speech_to_text_Lichess_fuzzy_words_2['night'] = 'n';
    speech_to_text_Lichess_fuzzy_words_2['brooke'] = 'r';

    chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words_2);
    chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words_2, function(result){
        console.log(result);

        speech_to_text_Lichess_fuzzy_words_2 = result;
        speech_to_text_Lichess_fuzzy_words_2['sex'] = '6';
        chrome.storage.local.set(speech_to_text_Lichess_fuzzy_words_2);

        chrome.storage.local.get(speech_to_text_Lichess_fuzzy_words_2, function(result){
            console.log(result);
    
        });
    });

    
});
