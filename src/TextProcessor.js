
//The text processing portion of the extension. Currently exists as a class, but there's really no need for this...
const EXCLUDE_LIST = ['__board_api_token', '__toggle'];

export default class TextProcessor {

    word_replacement_list;
    numberMap = 1;
    chessTermMap;

    constructor(){
        if(TextProcessor._instance)
            return TextProcessor._instance;
        
        TextProcessor._instance = this;

        this.createKeyWordMaps();
        this.setReplacementList();
    }

    parseSpeechText(text){
        let componentWords = this.processRawInput(text);
        let processedPhrase = componentWords.join(' ');
        let chessMove = this.extractChessMove(componentWords);
        
        return {    
            phrase: processedPhrase, 
            components: componentWords,
            move: chessMove
        };
    }
    processRawInput(text){

        let filteredText = this.filterText(text);
        return this.replaceWords(filteredText.split(' '));
    }

    filterText(text){
    
        //replace any capital letters;
        //put a space between 'letter-number' instances;
        //replace any punctuation with a space. 
        let filteredText = text.toLowerCase();
    
        //this creates an extra space; doesn't seem to cause problems
        filteredText = filteredText.replace(/([^0-9])([0-9])/g, '$1 $2');
        filteredText = filteredText.replace(/([0-9])([^0-9])/g, '$1 $2');
        
        //TODO maybe don't check for apostrophies, dashes
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

    replaceWords(wordList){
    
        let result = [];
        let replacementPhrase = '';

        if(word_replacement_list == undefined)
            throw 'word_replacement_list is undefined!';
        
        for(const word of wordList){
            if(word_replacement_list[word] != null && word_replacement_list[word] != undefined){
    
                //split replacement phrase. if just a single word, replacementPhrase will be an array of length 1; 
                //no additional code should be needed.
                replacementPhrase = word_replacement_list[word].split(' ');
                for(const subWord of replacementPhrase)
                    result.push(subWord);
            }
    
            else result.push(word);
        }
    
        return result;
    }

    extractCharacter(word){
    
        if(word.match(/\d/) == null){
    
            if(this.chessTermMap.has(word))
                return this.chessTermMap.get(word);
            
            else if(this.numberMap.has(word))
                return this.numberMap.get(word);
        }
    
        //Not a known term or a number; get first character
        let result = word.charAt(0);
        if (result.match(/[kqrn]/))
            result = result.toUpperCase();
        
        return result;
    }
    
    setReplacementList(){
        chrome.storage.local.get(['word_replacement_list'], function(result){
            this.word_replacement_list = result['word_replacement_list'];
        });
    }

    createKeyWordMaps(){
        let numberMap = new Map();
        let chessTermMap = new Map();

        numberMap.set('one', '1');
        numberMap.set('two', '2');
        numberMap.set('three', '3');
        numberMap.set('four', '4');
        numberMap.set('five', '5');
        numberMap.set('six', '6');
        numberMap.set('seven', '7');
        numberMap.set('eight', '8');
    
        chessTermMap.set('king', 'K');
        chessTermMap.set('queen', 'Q');
        chessTermMap.set('rook', 'R');
        chessTermMap.set('bishop', 'B');
        chessTermMap.set('knight', 'N');
        chessTermMap.set('capture', 'x');
        chessTermMap.set('take', 'x');
        chessTermMap.set('promote', '=');
        chessTermMap.set('equals', '=');
        chessTermMap.set('castle', 'O-O');
        chessTermMap.set('long', 'O-');
        chessTermMap.set('short', '');

        this.numberMap = numberMap;
        this.chessTermMap = chessTermMap;
    }
}