
chrome.runtime.onInstalled.addListener((details)=>{
    console.log("The extension has been installed!");

    let word_replacement_list = {

        "night": "knight",
        "knights": "knight",
        "brooke": "rook",
        "kapture": "capture",
        "takes": "take",
        "captures": "capture",
        "clean": "queen",
        "echosex": "echo six",
        "won": "1",

        "to": "2",
        "too": "2",
        "ii": "2",
        
        "iii": "3",

        "for": "4",
        "force": "4",
        "ford": "4",
        "iv": "4",
    
        "v": "5",
    
        "sticks": "6",
        "stix": "6",
        "sex": "6",
        "vi": "6",

        "vii": "7",
        "hate": "8",
        "ate": "8",
        "viii": "8",

        "except": "accept",
        "excepts": "accept",
        "overdraw": "offer draw",
        "offered": "offer",
        "aboard": "abort",
        "flipboard": "flip board",
        "footboard": "flip board",
        "clipboard": "flip board"
        // "": "",
    };

    let TOGGLE_LISTEN = {'__toggle': false};
    chrome.storage.local.set({'word_replacement_list': word_replacement_list});
    chrome.storage.local.set(TOGGLE_LISTEN);
    
    // let TEXT_INPUT = {'__text_input': false};
    // chrome.storage.local.set(TEXT_INPUT);

});
