//Trying a file dedicated to API calls
const _MOVES_DATA_IDENTIFIER = "\"moves\":";

async function testToken(token){
    //still throws 401 error in console if invalid token, there's probably some way to catch this
    display_move.innerHTML = "Checking Token...";
    fetch('https://lichess.org/api/account', {
    
        headers: {
            'Authorization': 'Bearer ' + token
        }
    
        })
        .then(res => res.json())
        .then(function(res){

            if(res.hasOwnProperty('error')){
                display_move.innerHTML = "API token fetch failed: " + res['error']
                 + ". add new API token in options. User can still use SAN format submissions through the input text box.";
                
            }
            else {
                console.log("Valid API token is in use!");
                BOARD_API_TOKEN = token;
                checkIfActiveGame();
                display_move.innerHTML = DISPLAY_MESSAGE;
            }
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
            
            const color = game_info.color.charAt(0);
            console.log(game_info);
            setInitialGameState(color);
            streamGameData();

            console.log(`You are playing the ${game_info.color} pieces!`);

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

                console.log("started");
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
    
    //TODO: display move never actually displays move right now...
    fetch(api_url, fetchRequestObject)
        .then(res => res.json())
        .then(function(res){
            
            console.log(res);
            if(res['ok']){
                display_move.innerHTML = API_SUBMIT_SUCCESS;
            }

            else {
                display_move.innerHTML = API_SUBMIT_FAIL;
            }
    });

}
