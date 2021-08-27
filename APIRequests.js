//Trying a file dedicated to API calls
const _MOVES_DATA_IDENTIFIER = "\"moves\":";

async function testToken(token){
    //still throws 401 error in console if invalid token, there's probably some way to catch this    
    return new Promise((resolve, reject) =>{
        fetch('https://lichess.org/api/account', {
    
            headers: {
                'Authorization': 'Bearer ' + token
            }
        
            })
            .then(res => res.json())
            .then(function(res){
                
                console.log(res);
                if(res.hasOwnProperty('error')){
                    reject(res);                    
                }
                else {
                    resolve(token);
                }
            });
    });
}


async function checkIfActiveGame(){
    
    let response = await fetch('https://lichess.org/api/account/playing', {
    
    headers: {
      'Authorization': 'Bearer ' + BOARD_API_TOKEN
    }
    });

    if(!response.ok){
        throw new Error("shit didn't work yo");
    }
    let gameList = await response.json();

    for(game_info of gameList.nowPlaying){

        if(game_info.fullId === lichessLocation || game_info.gameId === lichessLocation){
            
            console.log(game_info);

            const color = game_info.color.charAt(0);
            const speed = game_info.speed;
            const legalGameSpeeds = ['correspondence', 'rapid', 'classical'];

            if(legalGameSpeeds.includes(speed)){
                console.log(`${speed} allows API moves, setting up game state streaming...`);
                setInitialGameState(color);
                streamGameData();
                console.log(`You are playing the ${game_info.color} pieces!`);    
                legalGameSpeed = true;
            }

            else {
                console.log(`${speed} does not allow API moves. Setting up textbox submission...`);
            }
            // board_api_url = createTemplateURL();
        }
    }
}

async function streamGameData(){
    
    let fetchRequestObject = {
        headers: {
            'Authorization': 'Bearer ' + BOARD_API_TOKEN
        }
    };

    fetch(`https://lichess.org/api/board/game/stream/${lichessLocation}`, fetchRequestObject)
    .then(response => response.body)
    .then(function(res){
        
        const reader = res.getReader();
        return new ReadableStream({
            async start(controller){

                while (true){
                    const {done, value} = await reader.read();

                    //value is the ndjson we need to read *I think*
                    readBoardData(value);

                    if(done) break;
                    
                    controller.enqueue(value);
                }

                console.log('done');
                controller.close();
                reader.releaseLock();
            }

        });
    });
}

async function readBoardData(value){
    let line = new TextDecoder().decode(value);

    if(line.length > 0 && line.includes(_MOVES_DATA_IDENTIFIER)){


        let newMovesArray = line.substring(line.indexOf(_MOVES_DATA_IDENTIFIER) + _MOVES_DATA_IDENTIFIER.length + 1).split('\"')[0].split(' ');
        console.log(newMovesArray.toString());

        if(newMovesArray.toString() !== movesList.toString()){

            updateGameState(newMovesArray);
            console.log("game moves updated.");
        }
    }
}

async function postMove(chessMove){
    
    let api_url = API_ADDRESS_TEMPLATE.replace('--UCI_MOVE--', chessMove);
    let fetchRequestObject = {

        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + BOARD_API_TOKEN
        }
    };

    return new Promise((resolve, reject) =>{
        
        fetch(api_url, fetchRequestObject)
        .then(res => res.json()).then(function(res){
            
            console.log(res);
            if(res['ok']){
                resolve();
            }

            else {
                console.log('reject comes next');
                reject(res);
            }
        });
    });
}
