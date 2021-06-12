chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);

    const command_entered = command;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command_entered });
    });

    var recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

  });

