

//TODO: destroy this and make just a javascript file, not a class. binding is stupid
//tho it is working right now? i dunno


const EXCLUDE_LIST = ['__board_api_token', '__toggle'];

class TextProcessor {

    word_replacement_list;
    numberMap;
    chessTermMap;


    constructor(){
        if(TextProcessor._instance){
            return TextProcessor._instance;
        }

        TextProcessor._instance = this;

        this.createKeyWordMaps();
        this.setReplacementList();
    }


    processSpeechInput(speechText){

        let filteredText = this.filterRawInput(speechText);

        //save the phrase to show the user in popup what phrase was heard (before replacing any words)
        chrome.storage.local.set({last_command: filteredText});

        return this.replaceWords(filteredText.split(' '));
    }


    filterRawInput(speechText){
    
        //replace any capital letters;
        //put a space between 'letter-number' instances;
        //replace any punctuation with a space. 

        let filteredText = speechText.toLowerCase();
    
        //this creates an extra space; doesn't seem to cause problems
        filteredText = filteredText.replace(/([^0-9])([0-9])/g, '$1 $2');
        filteredText = filteredText.replace(/([0-9])([^0-9])/g, '$1 $2');
        filteredText = filteredText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
    
        while(filteredText.includes('  ')){
            filteredText = filteredText.replace('  ', ' ');
        }
    
        return filteredText;
    }

    extractChessMove(componentWords){
    
        let chessMove = '';
        for(const word of componentWords){
            chessMove += this.extractCharacter(word);
        }
        return chessMove;
    }

    replaceWords(wordArray){
    
        let result = [];
        let replacementPhrase = '';

        if(word_replacement_list == undefined)
            throw 'word_replacement_list is undefined!';
        
        for(const word of wordArray){
            if(word_replacement_list[word] != null && word_replacement_list[word] != undefined){
    
                //split replacement phrase. if just a single word, replacementPhrase will be an array of length 1; 
                //no additional code should be needed.
                console.log('found word to replace');
                replacementPhrase = word_replacement_list[word].split(' ');
                for(const subWord of replacementPhrase){
                    result.push(subWord);
                }
            }
    
            else result.push(word);
        }
    
        return result;
    }

    extractCharacter(word){
    
        if(word.match(/\d/) == null){
    
            if(this.chessTermMap.has(word)){
                return this.chessTermMap.get(word);
            }
    
            else if(this.numberMap.has(word)){
                return this.numberMap.get(word);
            }
        }
    
        //if here: get first letter of word/get digit
        return word.charAt(0);
    }
    
    //not currently being used
    replacePunctuation(word){
        return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
    }
        
    setReplacementList(){
        console.log('setting replacement list');
        chrome.storage.local.get(['word_replacement_list'], function(result){
            this.word_replacement_list = result['word_replacement_list'];
            console.log(this.word_replacement_list);
        });
    }

    updateReplacementList(){
        this.setReplacementList();
    }

    createKeyWordMaps(){
        this.numberMap = new Map();
        this.chessTermMap = new Map();

        this.numberMap.set('one', '1');
        this.numberMap.set('two', '2');
        this.numberMap.set('three', '3');
        this.numberMap.set('four', '4');
        this.numberMap.set('five', '5');
        this.numberMap.set('six', '6');
        this.numberMap.set('seven', '7');
        this.numberMap.set('eight', '8');
    
        this.chessTermMap.set('king', 'K');
        this.chessTermMap.set('queen', 'Q');
        this.chessTermMap.set('rook', 'R');
        this.chessTermMap.set('bishop', 'B');
        this.chessTermMap.set('knight', 'N');
        this.chessTermMap.set('capture', 'x');
        this.chessTermMap.set('take', 'x');
        this.chessTermMap.set('promote', '=');
        this.chessTermMap.set('equals', '=');
        this.chessTermMap.set('castle', '0-0');
        this.chessTermMap.set('long', '0-');
        this.chessTermMap.set('short', '');
    }
}


// let testInstance = new TextProcessor();

// console.log(testInstance.numberMap);