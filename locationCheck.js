const lichessLocation = location.href
                    .replace('http://', '')
                    .replace('https://', '')
                    .replace('lichess.org/', '')
                    .replace('lichess.org', '');

// let isOngoingGame = false;

// if(checkIfGamePage(lichessLocation)){
//     console.log("might be ongoing game...");
//     isOngoingGame = checkIfActiveGame().then(res =>{
//         console.log(res);
//     });
//     console.log(isOngoingGame);
// }

// if(!isOngoingGame) console.log("Not ongoing game page.");

// else {

/**
     * TODO: Previously played games will still return true! They use the entire 12 character id in the URL. 
     * Can either only run script on 8 character games, or check if current game (possibly through API fetch)
     */
 function checkIfGamePage(location){
        
    //locations with 8 or 12 alphanumeric characters
    const KNOWN_LOCATIONS = [
        'analysis',
        'streamer',
        'practice',
        'training'];

    let numChars = location.length;
    
    //check if on home page (lichess.org/) or location is somehow null or undefined
    if(numChars != null || numChars != undefined || numChars != 0){

        //check if alphanumeric; if not, then can't be game page
        if(location.match(/^[a-z0-9]+$/i)){

            //check length of alphanumeric string. if 8 or 12, then might be game page
            if(numChars == 8 || numChars == 12){

                //finally, make sure location is not in our known location list:
                if(!KNOWN_LOCATIONS.includes(location)){
                    
                    return true;
                }
            }
        }
    }

    return false;
}

const isGamePage = checkIfGamePage(lichessLocation);