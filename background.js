
let word_replacement_list = {

    "night": "knight",
    "knights": "knight",
    "brooke": "rook",
    "brook": "rook",
    "rick": "rook",
    "kapture": "capture",
    "takes": "take",
    "captures": "capture",
    "clean": "queen",
    
    "won": "1",

    "to": "2",
    "too": "2",
    "ii": "2",
    
    "iii": "3",

    "for": "4",
    "force": "4",
    "ford": "4",
    "iv": "4",
    "war": "4",


    "v": "5",

    "sticks": "6",
    "stix": "6",
    "sex": "6",
    "vi": "6",

    "vii": "7",
    "hate": "8",
    "ate": "8",
    "viii": "8",

    "echosex": "echo 6",
    "gulfport": "golf 4",

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
let IGNORE_LIST = ['last_command', '__toggle', '__board_api_token'];

chrome.runtime.onInstalled.addListener((details)=>{

    const previousVersion = details.previousVersion;
    const reason = details.reason;

    switch (reason){

        case 'install':
            newInstallStorage();
            showUserOptions();
            break;
        
        case 'update':
            if(previousVersion.includes('2.0'))
                updateOldStorage();
            break;
    }
});

function newInstallStorage(){

    chrome.storage.local.set({'word_replacement_list': word_replacement_list});
    chrome.storage.local.set({'__toggle': TOGGLE_LISTEN});
}

function updateOldStorage(){

    chrome.storage.local.get(null, function(result){
        
        chrome.storage.local.clear();

        const oldKeys = Object.keys(result);
        for(key of oldKeys){

            if(IGNORE_LIST.includes(key)){
                const storeObj = {};
                storeObj[key] = result[key];
                chrome.storage.local.set(storeObj);
            }

            else word_replacement_list[key] = result[key];
        }

        chrome.storage.local.set({'word_replacement_list': word_replacement_list});
    });
}

function showUserOptions(){
    chrome.runtime.openOptionsPage();
}
