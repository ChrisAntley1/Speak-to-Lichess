/**
 * Must keep track of USER's pieces, not so much opponent's pieces; HOWEVER, must recognize when opponent has captured one of our pieces.
 * To do this, keep a board map; square coordinate will be the key, and will specify which of the user's pieces resides there.
 * When new game data comes in, update according to whether it is our turn or not (if index of move in translatedMoveList is odd(white) or even(black))
 * 
 * If OUR turn, update the position of one of our pieces. If castles, update both king and rook location. If promotion, update piece value. 
 * 
 * If OPPONENTS turn, read the square their piece has moved to; if one of our pieces resides at that square, delete it from board map (captured!)
 * 
 * 
 * PROBLEM: SAN doesn't require you to specify between 2 same-type pieces if both pieces can technically access a square, but one is blocked
 * 
 * EXAMPLE: You have 2 rooks, 1 on a1, the other on a8. Your opponent has a pawn on a2 and a queen on a4. Ra4 is a valid move; knows that the blocked rook
 * is not a candidate piece.
 * 
 * Revised Requirements:
 * 
 * Keep track of whole board, including user and opponent's pieces. 
 *      - handle special special cases: castles (for both sides) and promotions
 *      - in ALL cases where the API returns an error: inform user that take-backs can break piece recognition; advise refreshing; 
 *      - also advise to check if valid move since game won't give as much feedback as clicking and moving a piece would
 *      - keep seperate lists of each piece type; each entry will simply be the location of that piece
 *      - must keep track of opponent's piece type to check for pins to king
 * Try and generate valid UCI move based on the board state and the provided UCI move.
 * 
 * For all pieces:
 *      - do NOT have to check if target square is occupied. User is simply submitting an invalid move; API will handle
 *      - DO have to check for castling; might include flag to stop this check once castling occurs. 
 * For pawns: 
 *      - user is white and moves a pawn to the 4th rank: check 3rd and THEN 2nd ranks for pawns on that column
 *      - user is black and moves a pawn to the 5th rank: check 6th and THEN 7th rank for pawns on that column
 *          ** for either of the above case where a 2 square pawn move appears to be the request, no need to check if piece is blocked. 
 *              User is simply submitting an invalid move; API will handle
 *      - else assume pawn's location is one square behind target square 
 * 
 * For queens/bishops/rooks/knights:
 *      0. check if a piece of the target piece type exists in user's piece list
 *          -- if NOT, inform user target piece was not found; advise that they should refresh page (since we know take-backs will not be tracked)
 *      
 *      1. check if there is only one piece of the target piece type; if so, simply generate the move regardless of validity
 * 
 *      2. if MORE than one, check if there is identifying information specifying the piece location
 *          -- if this successfully narrows it down to one piece, simply generate the move regardless of validity
 *          -- technically NOT valid SAN format in case where piece identification is not necessary??
 *      
 *      3. if MORE than one AND no identifying information, only NOW do we read the board state and determine which piece could move to that square:
 *          -- if only one piece has line of sight to target square, generate move using this piece. Line of sight means NOT BLOCKED!
 *              **for knights: if only 1 knight is within knight's range of the target square
 *      
 ̶*̶ ̶ ̶ ̶ ̶ ̶ ̶4̶.̶ ̶i̶f̶ ̶m̶o̶r̶e̶ ̶t̶h̶a̶n̶ ̶o̶n̶e̶ ̶h̶a̶s̶ ̶l̶i̶n̶e̶ ̶o̶f̶ ̶s̶i̶t̶e̶ ̶(̶k̶n̶i̶g̶h̶t̶s̶:̶ ̶i̶s̶ ̶w̶i̶t̶h̶i̶n̶ ̶r̶a̶n̶g̶e̶)̶ ̶o̶f̶ ̶t̶a̶r̶g̶e̶t̶ ̶s̶q̶u̶a̶r̶e̶,̶ ̶c̶h̶e̶c̶k̶ ̶f̶o̶r̶ ̶p̶i̶n̶s̶ ̶t̶o̶ ̶k̶i̶n̶g
*̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶-̶-̶ ̶i̶f̶ ̶p̶i̶e̶c̶e̶ ̶h̶a̶s̶ ̶l̶i̶n̶e̶ ̶o̶f̶ ̶s̶i̶g̶h̶t̶ ̶t̶o̶ ̶o̶w̶n̶ ̶k̶i̶n̶g̶ ̶A̶N̶D̶ ̶e̶n̶e̶m̶y̶ ̶p̶i̶e̶c̶e̶ ̶i̶s̶ ̶a̶t̶t̶a̶c̶k̶i̶n̶g̶ ̶o̶n̶ ̶t̶h̶a̶t̶ ̶c̶o̶l̶u̶m̶n̶/̶r̶o̶w̶/̶d̶i̶a̶g̶o̶n̶a̶l̶,̶ ̶r̶e̶m̶o̶v̶e̶ ̶a̶s̶ ̶c̶a̶n̶d̶i̶d̶a̶t̶e̶ ̶p̶i̶e̶c̶e̶
̶*̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶ ̶-̶-̶ ̶i̶f̶ ̶o̶n̶l̶y̶ ̶o̶n̶e̶ ̶p̶i̶e̶c̶e̶ ̶r̶e̶m̶a̶i̶n̶s̶ ̶t̶h̶a̶t̶ ̶c̶a̶n̶ ̶l̶e̶g̶a̶l̶l̶y̶ ̶m̶o̶v̶e̶,̶ ̶g̶e̶n̶e̶r̶a̶t̶e̶ ̶m̶o̶v̶e̶ ̶u̶s̶i̶n̶g̶ ̶t̶h̶i̶s̶ ̶p̶i̶e̶c̶e̶*     
*      
*      4. We DO NOT check for pins! Even though Lichess records moves in SAN format without specifying the not-pinned piece, user is 
*          expected to specify the piece when using the text input box. We will assume the same requirement; do not want our extension 
*          to "assist" the user by automatically picking the valid piece.
*          -- fuck yeah less work lmao
* 
*      5. if at this point, then all hope is lost. 
*          -- user is either not giving enough information to specify their target piece, or our board state is incorrect
*          -- probably inform user of both
*          -- send move using arbitrary piece of target type regardless?
*/
const INVALID_MOVE = 'Invalid move detected; your move did not follow any expected SAN or UCI formats.'
const BUILDING_BOARD = 'movelist length was 0 or takeback occured. Building board state from starting position...';
const NO_SUCH_PIECE = 'updateUserPiece: attempting to update piece that does not exist in userPieceMap!';
const MUST_SPECIFY_PIECE = 'More than 1 piece has access to this square; user must specify the correct piece!';

let castleMap;
let movesList = [];
let userColor = '';
let pieceRow = 0;
let pawnRow = 0;
let userPieceMap;
let kingSideCastle;
let queenSideCastle;

//this probably doesn't need to be var
var board;

const columns = ['-','a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function setInitialGameState(color){
    
    setStartingPosition();
    userColor = color;
    castleMap = new Map();

    castleMap.set('e8c8', 'a8d8');
    castleMap.set('e8g8', 'h8f8');
    castleMap.set('e1c1', 'a1d1');
    castleMap.set('e1g1', 'h1f1');

    if(userColor === "w"){
        pawnRow = 2;
        pieceRow = 1;
    }

    if(userColor === "b"){
        pawnRow = 7;
        pieceRow = 8;
    }
    kingSideCastle = `e${pieceRow}g${pieceRow}`;
    queenSideCaslte = `e${pieceRow}c${pieceRow}`;

    setUserPieces();
}

/**
 * TODO: 
 */
function updateGameState(updatedMoveList){

    //if no moves recorded yet OR if a takeback possibly occured
    if(movesList.length == 0 || updatedMoveList.length - movesList.length != 1){
        
        console.log(BUILDING_BOARD);
        setStartingPosition();
        setUserPieces();
        for(move of updatedMoveList)
            movePiece(move);
    }

    //make sure our lists are consistent up to the point of the last known move; if not, a takeback has occured and shits gotta change
    else if(isMovesListValid(updatedMoveList) == true){
        const newMove = updatedMoveList[updatedMoveList.length - 1];
        movePiece(newMove);
    }
    
    movesList = updatedMoveList;

    console.log(board);

}

function setStartingPosition(){
    board = new Object({
        'a': [0, 'wR', 'wp', '--', '--', '--', '--', 'bp', 'bR'],
        'b': [0, 'wN', 'wp', '--', '--', '--', '--', 'bp', 'bN'],
        'c': [0, 'wB', 'wp', '--', '--', '--', '--', 'bp', 'bB'],
        'd': [0, 'wQ', 'wp', '--', '--', '--', '--', 'bp', 'bQ'],
        'e': [0, 'wK', 'wp', '--', '--', '--', '--', 'bp', 'bK'],
        'f': [0, 'wB', 'wp', '--', '--', '--', '--', 'bp', 'bB'],
        'g': [0, 'wN', 'wp', '--', '--', '--', '--', 'bp', 'bN'],
        'h': [0, 'wR', 'wp', '--', '--', '--', '--', 'bp', 'bR']
    });
}

function setUserPieces(){

    userPieceMap = new Map();

    const userPawn = userColor+'p';

    for(let i = 1; i<= 8; i++){
        userPieceMap.set(columns[i] + pawnRow, userPawn);
    }

    console.log("game state initialized.");

    userPieceMap.set('a' + pieceRow, userColor + 'R');
    userPieceMap.set('b' + pieceRow, userColor + 'N');
    userPieceMap.set('c' + pieceRow, userColor + 'B');
    userPieceMap.set('d' + pieceRow, userColor + 'Q');
    userPieceMap.set('e' + pieceRow, userColor + 'K');
    userPieceMap.set('f' + pieceRow, userColor + 'B');
    userPieceMap.set('g' + pieceRow, userColor + 'N');
    userPieceMap.set('h' + pieceRow, userColor + 'R');

}
function movePiece(move){

    const startingSquare = move.slice(0, 2);
    const destinationSquare = move.slice(2, 4);

    let movingPiece = board[startingSquare[0]][startingSquare[1]].toString();
    // const pieceColor = movingPiece.charAt(0);
    const destPiece = board[destinationSquare[0]][destinationSquare[1]];

    if (movingPiece === '--'){
        throw 'there is no piece on the starting square; you done fucked up now';
    }

    //check if piece is promoting; this move will always be from the Board API response, format should be consistent
    if(move.length == 5){
        movingPiece = movingPiece[0] + move[4].toUpperCase();
        if (movingPiece.includes(userColor)){
            promoteUserPawn(startingSquare, movingPiece);

        }

        console.log(movingPiece + ' was created on the board via promotion.');
    }

    if (destPiece.includes(userColor))
        deleteUserPiece(destinationSquare);
    

    if (movingPiece.includes(userColor))
        updateUserPiece(startingSquare, destinationSquare);
    
    board[destinationSquare[0]][destinationSquare[1]] = movingPiece;
    board[startingSquare[0]][startingSquare[1]] = '--';

    //CASTLE REVISED 
    if(castleMap.has(move) && movingPiece.includes('K')){
        movePiece(castleMap.get(move));
    }
    
}

function isMovesListValid(updatedMoveList){

    //start from back of moves list to find discrepancies more quickly
    for(let i = movesList.length - 1; i>= 0; i--){

        if(updatedMoveList[i] !== movesList[i]) return false;
    }

    return true;
}

function deleteUserPiece(capturedPieceSquare){
    
    //lol
    if(userPieceMap.delete(capturedPieceSquare));
    
    else throw 'attempted to delete piece that did not exist in user piece list??';


}

function promoteUserPawn(startingSquare, newPiece){
    
    if (userPieceMap.get(startingSquare) == undefined){
        throw 'promoteUserPawn: attempting to promote pawn that does not exist in userPieceMap!';
    }

    // newPiece = newPiece[0] + newPiece[1];
    userPieceMap.set(startingSquare, newPiece);

    console.log('promoteUserPawn: success');
}

function updateUserPiece(previousSquare, newSquare){

    const piece = userPieceMap.get(previousSquare);

    if(piece == undefined){
        console.log(NO_SUCH_PIECE);
    }
    
    userPieceMap.delete(previousSquare);
    userPieceMap.set(newSquare, piece);

    console.log('updateUserPiece: success');
}

//TODO: currently assuming any non UCI format input is SAN; may be problematic later
function getUCIFromSAN(sanMove){

    sanMove = removeCaptureNotation(sanMove);
    //attempt to parse a SAN format move into a UCI format move

    resultMove = -1;
    if(/[a-h]/.test(sanMove.charAt(0))) resultMove =  getPawnMove(sanMove);

    else if(/[QRBNK]/.test(sanMove.charAt(0))) resultMove =  getPieceMove(sanMove);

    else if(sanMove === '0-0' || sanMove === '0-0-0') resultMove =  getCastleMove(sanMove);

    return resultMove;
}

function getPawnMove(sanMove){

    sanMove = sanMove.replace('=', '');

    let destination = sanMove.match(/[a-h][1-8]/);

    if(destination == null){
        console.log(INVALID_MOVE);
        return -1;
    }
    else destination = destination[0];
    
    if(destination === ''){
        console.log(INVALID_MOVE);
        return -1;
    }
    
    const col = destination[0];
    const destRow = parseInt(destination[1]);

    let direction = 0;
    if(userColor === 'b')
        direction = -1;
    
    if(userColor === 'w')
        direction = 1;

    if(sanMove.length == 2){
        //if move to rank 4 for white or rank 5 for black, check pawn map
        if((destRow == 5 && userColor == 'b') || (destRow == 4 && userColor == 'w')){ 
            if(board[col][destRow - direction] !== (userColor + 'p'))
                return col + (destRow - (direction * 2)) + destination;
            
        }
        //else assume pawn's position
        return  col + (destRow - direction) + destination;
    }

    if (sanMove.length == 3){

        //capturing
        if(/[a-h][a-h][1-8]/.test(sanMove))
            return sanMove[0] + (destRow - direction) + destination;
        
        if(/[a-h][1-8][QRBN]/.test(sanMove))
            return col + (destRow - direction) + destination + sanMove[sanMove.length - 1];
    }

    if(sanMove.length == 4)
        if(/[a-h][a-h][1-8][QRBN]/.test(sanMove))
            return sanMove[0] + (destRow - direction) + destination + sanMove[sanMove.length - 1];
    
    return -1;
}

function getCastleMove(sanMove){
    
    if(sanMove === '0-0') return kingSideCastle;
    if(sanMove === '0-0-0') return queenSideCastle;

    return -1;
}

function getPieceMove(sanMove){

    let translatedMove = '';
    const piece = sanMove[0];
    let pieceList = getPieceList(piece);

    if(pieceList == -1){
        // throw 'panik';
        return -1;
    }
    let moveComponents = getPieceMoveComponents(sanMove);

    if(pieceList.length == 1)
        translatedMove = pieceList[0] + moveComponents.destination;
    
    else {

        const validPiece = findValidPiece(pieceList, moveComponents);
        if(validPiece == -1)
            return -1;
        translatedMove =  validPiece + moveComponents.destination;
    }
    return translatedMove;
}

function getPieceList(piece){

    const userPiece = userColor + piece.toUpperCase();
    let pieceList = [];

    //do we need to get the tuple of key and value or just the value? Value might be more simple?
    for(entry of userPieceMap.entries()){
        if (entry[1] == userPiece)
            pieceList.push(entry[0]); //pushing just the key 
    }
    
    if(pieceList.length == 0)
        return -1;
    
    return pieceList;
}

function getPieceMoveComponents(sanMove){
    
    const moveLength = sanMove.length;
    let moveComponents = {};
    moveComponents.piece = sanMove[0];

    moveComponents.squareInfo = sanMove.substr(1, moveLength - 3);
    moveComponents.destination = sanMove.substr(moveLength - 2, 2);

    return moveComponents;
}

//called if pieceList is longer than 1
//TODO: if we do not need to check for pins, there may be no need to store squares in arrays; consider changing at some point
function findValidPiece(pieceList, moveComponents){

    //piece list has a list of keys (squares) from map
    //moveComponents has piece, squareInfo, destination
    let validPieces = [];
    
    //first, check if identifying info successfully narrows it down to a single piece
    if(moveComponents.squareInfo !== ''){
        
        for (square of pieceList){
            if(square.includes(moveComponents.squareInfo)){
                validPieces.push(square);
            }
        }
    
        if(validPieces.length == 0){
            console.log('No piece with access to destination square found');
            return -1;
        }
        
        else if (validPieces.length == 1)
            return validPieces[0];
        
        else {
            console.log('squareInfo allows for more than 1 valid piece; user must identify piece');
            return -1;
        }
    }

    //no starting square info; now checking which pieces are in range of the target square
    //must ALSO check for blocking
    for(square of pieceList){
        if (pieceHasAccess(square, moveComponents.destination, moveComponents.piece)){
            validPieces.push(square);
            //add to valid squares
        }
    }

    if(validPieces.length == 0){
        console.log('None of the valid pieces found are in range of the destination square');
        return -1;
    }
    else if (validPieces.length == 1)
        return validPieces[0];
    
    else console.log(MUST_SPECIFY_PIECE);
    
    return -1;
}

function pieceHasAccess(start, dest, piece){
    coordinates = getNumericCoordinates(start, dest);
    if(piece.match('N'))
        return inKnightRange(coordinates);

    else if((sharesColumn(coordinates) || sharesRow(coordinates)) && piece.match(/[QR]/) && !isBlocked(coordinates)){

        //if not blocked
        //involves checking squares between starting and ending squares in the board object
        return true;
    }
    else if(sharesDiagonal(coordinates) && piece.match(/[QB]/) && !isBlocked(coordinates)){

        //if not blocked
        return true;
    }
    
    return false;
}

function inKnightRange(coordinates){
    
    let diffCol = Math.abs(coordinates.startCol - coordinates.destCol);
    let diffRow = Math.abs(coordinates.startRow - coordinates.destRow);

    if(diffRow > 2 || diffCol > 2) return false;
    
    if(Math.abs(diffCol - diffRow) == 1) return true;
    
    return false;
}

function sharesColumn(coordinates){
    return coordinates.startCol == coordinates.destCol;
}

function sharesRow(coordinates){
    return coordinates.startRow == coordinates.destRow;
}

function sharesDiagonal(coordinates){
    return (Math.abs(coordinates.startCol - coordinates.destCol) == Math.abs(coordinates.startRow - coordinates.destRow));
}

function getNumericCoordinates(start, dest){
    return {
        startCol: columns.indexOf(start[0]),
        startRow: parseInt(start[1]),
        destCol: columns.indexOf(dest[0]),
        destRow: parseInt(dest[1])
    }
}

function isBlocked(coordinates){

    let rowDir, colDir;
    //squares are on the same column
    if(coordinates.startCol - coordinates.destCol == 0){
        colDir = 0;
        coordinates.startRow > coordinates.destRow ? rowDir = -1: rowDir = 1;
    }

    //squares are on the same row
    else if(coordinates.startRow - coordinates.destRow == 0){
        rowDir = 0;
        coordinates.startCol > coordinates.destCol ? colDir = -1: colDir = 1;
    }
    //squares are on the same diagonal
    else if((Math.abs(coordinates.startCol - coordinates.destCol) == Math.abs(coordinates.startRow - coordinates.destRow))){

        coordinates.startCol > coordinates.destCol ? colDir = -1: colDir = 1;
        coordinates.startRow > coordinates.destRow ? rowDir = -1: rowDir = 1;
    }

    else throw 'error: squares are not on same row, column, or diagonal';

    let checkRow = coordinates.startRow + rowDir;
    let checkCol = coordinates.startCol + colDir;

    //checks squares between start and dest; if blocked, returns true
    while(!(coordinates.destRow == checkRow && coordinates.destCol == checkCol)){
        
        //if square is occupied
        if(board[columns[checkCol]][checkRow] !== '--'){
            return true;
        }
        
        checkRow += rowDir;
        checkCol += colDir;
    }

    //squares have line of sight of each other
    return false;
}

function removeCaptureNotation(sanMove){
    return sanMove.replace('x', '');
}