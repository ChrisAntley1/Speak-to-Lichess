
import {lichessLocation} from './locationCheck.js';

const API_ADDRESS_TEMPLATE = "https://lichess.org/api/board/game/--GAME_ID--/move/--UCI_MOVE--".replace('--GAME_ID--', lichessLocation);

//user's personal Board API compatible token. Only needs Board API permissions
let board_api_token = '';

export async function testToken(token){
    //still throws 401 error in console if invalid token, there's probably some way to catch this    
    return new Promise((resolve, reject) =>{
        fetch('https://lichess.org/api/account', {
    
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(res => res.json())
        .then(function(res){
            
            if(res.hasOwnProperty('error'))
                reject(res);                    
            
            else resolve(token);
        });
    });
}

export async function checkIfActiveGame(){
    
    return new Promise(async (resolve, reject) =>{

        let response = await fetch('https://lichess.org/api/account/playing', {
        
            headers: {
                'Authorization': 'Bearer ' + board_api_token
            }
        });

        if(!response.ok)
            reject(response);

        let gameList = await response.json();
        let isActiveGame = false;
        
        for(let game_info of gameList.nowPlaying){

            if(game_info.fullId === lichessLocation || game_info.gameId === lichessLocation){
                
                isActiveGame = true;
                console.log(game_info);
    
                const speed = game_info.speed;
                const legalGameSpeeds = ['correspondence', 'rapid', 'classical'];
    
                if(legalGameSpeeds.includes(speed))
                    resolve(game_info);
                
                // Other ways for a game to be a direct challenge? also computer games?
                if(speed == 'blitz' && game_info.source == 'friend')
                    resolve(game_info);
                else reject(game_info);
            }
        }
        if(isActiveGame == false) reject({'isActiveGame': false});
    });
}

export async function streamGameData(parseData){
    console.log('streaming game data...');
    let fetchRequestObject = {
        headers: {
            'Authorization': 'Bearer ' + board_api_token
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

                    parseData(value);

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

export async function postMove(chessMove){
    
    let api_url = API_ADDRESS_TEMPLATE.replace('--UCI_MOVE--', chessMove);
    let fetchRequestObject = {

        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + board_api_token
        }
    };

    return new Promise((resolve, reject) =>{
        
        fetch(api_url, fetchRequestObject)
        .then(res => res.json()).then(function(res){
            
            if(res['ok']) resolve();

            else reject(res);
        });
    });
}

export function setAPIToken(token){
    board_api_token = token;
}

// module.exports = {  testToken,
//                     setAPIToken,
//                     postMove, 
//                     readBoardData,
//                     checkIfActiveGame,
//                     streamGameData };

