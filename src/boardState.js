
const REBUILDING_BOARD_STATE = 'updateGameState: either more than 1 new move received, or takeback has occured; building board state from starting position...';
const NO_SUCH_PIECE = 'updateUserPiece: attempting to update piece that does not exist in userPieceMap...';
const MUST_SPECIFY_PIECE = 'findValidPiece: more than 1 piece of this type has access to destination square; user must further specify target piece...';
const ALL_PIECES_BLOCKED = 'findValidPiece: more than 1 piece of this type has access to destination square AND are all blocked... '
const NONE_IN_RANGE = 'findValidPiece: valid pieces discovered are all not in range of the destination square...'


let movesList = [];
let userColor = '';
let userPieceMap;
let kingSideCastle;
let queenSideCastle;

let board;

let castleRookMoveMap = new Map();

castleRookMoveMap.set('e8c8', 'a8d8');
castleRookMoveMap.set('e8g8', 'h8f8');
castleRookMoveMap.set('e1c1', 'a1d1');
castleRookMoveMap.set('e1g1', 'h1f1');

const columns = ['-','a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function setInitialGameState(color){
    
    setStartingPosition();
    userColor = color;

    let pieceRow = 0;
    let pawnRow = 0;

    if(userColor === "w"){
        pawnRow = 2;
        pieceRow = 1;
    }

    if(userColor === "b"){
        pawnRow = 7;
        pieceRow = 8;
    }
    kingSideCastle = `e${pieceRow}g${pieceRow}`;
    queenSideCastle = `e${pieceRow}c${pieceRow}`;

    setUserPieces(pieceRow, pawnRow);
}

function updateGameState(updatedMoveList){

    if(updatedMoveList.length - movesList.length == 1 && isMovesListValid(updatedMoveList) == true){
        const newMove = updatedMoveList[updatedMoveList.length - 1];
        movePiece(newMove);
    }

    else {
        console.log(REBUILDING_BOARD_STATE);
        
        setInitialGameState(userColor);
        for(move of updatedMoveList)
            movePiece(move);
    }

    movesList = updatedMoveList;

    //setting board back to starting position creates issue where movesList ends up with a single move ""
    if(updatedMoveList.length == 1 && updatedMoveList[0] === '')
        movesList = [];
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

function setUserPieces(pieceRow, pawnRow){

    userPieceMap = new Map();

    const userPawn = userColor+'p';

    for(let i = 1; i<= 8; i++)
        userPieceMap.set(columns[i] + pawnRow, userPawn);

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

    if(move == '')
        return;

    const startingSquare = move.slice(0, 2);
    const destinationSquare = move.slice(2, 4);

    let movingPiece = board[startingSquare[0]][startingSquare[1]].toString();
    const destPiece = board[destinationSquare[0]][destinationSquare[1]];

    if (movingPiece === '--')
        throw 'there is no piece on the starting square; you done fucked up now';

    //check if piece is promoting; this move will always be from the Board API response, format should be consistent
    if(move.length == 5){
        movingPiece = movingPiece[0] + move[4].toUpperCase();

        if (movingPiece.includes(userColor))
            promoteUserPawn(startingSquare, movingPiece);

        console.log(movingPiece + ' was created on the board via promotion.');
    }

    if (destPiece.includes(userColor))
        deleteUserPiece(destinationSquare);
    
    if (movingPiece.includes(userColor))
        updateUserPiece(startingSquare, destinationSquare);
    
    board[destinationSquare[0]][destinationSquare[1]] = movingPiece;
    board[startingSquare[0]][startingSquare[1]] = '--';

    if(castleRookMoveMap.has(move) && movingPiece.includes('K'))
        movePiece(castleRookMoveMap.get(move));
}

function isMovesListValid(updatedMoveList){

    for(let i = movesList.length - 1; i>= 0; i--)
        if(updatedMoveList[i] !== movesList[i]) return false;
    
    return true;
}

function deleteUserPiece(capturedPieceSquare){
    
    if(userPieceMap.get(capturedPieceSquare) == undefined)
        console.log('deleteUserPiece: ' + NO_SUCH_PIECE);
    
    userPieceMap.delete(capturedPieceSquare);
}

function promoteUserPawn(startingSquare, newPiece){
    
    if (userPieceMap.get(startingSquare) == undefined)
        throw 'promoteUserPawn: attempting to promote pawn that does not exist in userPieceMap!';

    userPieceMap.set(startingSquare, newPiece);

    console.log('promoteUserPawn: success');
}

function updateUserPiece(previousSquare, newSquare){

    const piece = userPieceMap.get(previousSquare);

    if(piece == undefined)
        console.log(NO_SUCH_PIECE);
    
    userPieceMap.delete(previousSquare);
    userPieceMap.set(newSquare, piece);
}

function getUCIFromSAN(sanMove){

    //this trimmedMove business feels weird but it works
    let trimmedMove = trimSAN(sanMove);
    let resultMove = sanMove;
    const firstChar = sanMove.charAt(0);

    if(/[a-h]/.test(firstChar)){
        
        resultMove = getPawnMove(trimmedMove);

        //Special bishop handling check; still undecided
        // if(resultMove == trimmedMove && firstChar === 'b')
        //     resultMove = getPieceMove(trimmedMove);
    }
    
    //checks for lowercase as well, for now
    else if(/[QRBNKqrnk]/.test(firstChar)) resultMove = getPieceMove(trimmedMove);

    else if(sanMove === '0-0' || sanMove === '0-0-0') resultMove = getCastleMove(trimmedMove);

    if(resultMove === trimmedMove) return sanMove;
    
    return resultMove;
}

function getPawnMove(sanMove){

    let destination = sanMove.match(/[a-h][1-8]/);

    if(destination == null) return sanMove;
    
    else destination = destination[0];
    
    if(destination === '') return sanMove;
    
    const col = destination[0];
    const destRow = parseInt(destination[1]);
    const userPawn = userColor + 'p';

    let direction = 0;
    if(userColor === 'b'){
        
        if(destRow > 6)
            return sanMove;
            
        else direction = -1;
    }
    if(userColor === 'w'){
        
        if(destRow < 3)
            return sanMove;

        else direction = 1;
    }
    
    if(sanMove.length == 2){
        

        //make sure a pawn belonging to the user is on the appropriate square
        //previously did not check for this; allowed for PIECES to move as well
        if(board[col][destRow - direction] === userPawn || board[col][destRow - (direction * 2)] === userPawn){
            
            //if move to rank 4 for white or rank 5 for black, check pawn map
            if((destRow == 5 && userColor == 'b') || (destRow == 4 && userColor == 'w')){ 
                
                if(board[col][destRow - direction] !== (userColor + 'p'))
                    return col + (destRow - (direction * 2)) + destination;
            }

            //else assume pawn's position
            return  col + (destRow - direction) + destination;
        }
    }

    const startingCol = sanMove[0];

    if (sanMove.length == 3){

        //capturing
        if(/[a-h][a-h][1-8]/.test(sanMove) && board[startingCol][destRow - direction] === userPawn)
            return startingCol + (destRow - direction) + destination;
        
        //promoting
        if(/[a-h][1-8][QRBN]/.test(sanMove) && board[startingCol][destRow - direction] === userPawn)
            return col + (destRow - direction) + destination + sanMove[sanMove.length - 1];
    }

    //capturing AND promoting
    if(sanMove.length == 4)
        if(/[a-h][a-h][1-8][QRBN]/.test(sanMove) && board[startingCol][destRow - direction] === userPawn)
            return startingCol + (destRow - direction) + destination + sanMove[sanMove.length - 1];
    
    return sanMove;
}

function getCastleMove(sanMove){
    
    if(sanMove === '0-0') return kingSideCastle;
    if(sanMove === '0-0-0') return queenSideCastle;
    return sanMove;
}

function getPieceMove(sanMove){
    
    if(sanMove.length < 3){
        console.log(`getPieceMove: invalid move format: ${sanMove}`);
        return sanMove;
    }
    let moveComponents = getPieceMoveComponents(sanMove);

    if(/[a-h][1-8]/.test(moveComponents.destination) == false){
        console.log(`getPieceMove: invalid destination square format: ${moveComponents.destination}`);
        return sanMove;
    }

    let pieceList = getPieceList(sanMove[0]);

    if(pieceList == -1) return sanMove;
    
    if(pieceList.length == 1)
        return pieceList[0] + moveComponents.destination;
    
    const validPiece = findValidPiece(pieceList, moveComponents);
    
    if(validPiece == -1) return sanMove;
        
    return validPiece + moveComponents.destination;
}

function getPieceList(piece){

    const userPiece = userColor + piece.toUpperCase();
    let pieceList = [];

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
    moveComponents.piece = sanMove[0].toUpperCase();

    moveComponents.squareInfo = sanMove.substr(1, moveLength - 3);
    moveComponents.destination = sanMove.substr(moveLength - 2, 2);

    return moveComponents;
}

//called if pieceList is longer than 1
//This logic could be simplified
function findValidPiece(pieceList, moveComponents){

    //pieceList has a list of keys (squares) from map
    //moveComponents has piece, squareInfo, destination
    let validPieces = [];
    
    //check if identifying info successfully narrows candidates down to a single piece
    if(moveComponents.squareInfo !== ''){
        
        for(square of pieceList){
            if(square.includes(moveComponents.squareInfo))
                validPieces.push(square);
        }
    
        if(validPieces.length == 0){
            console.log(`No piece was found using provided squareInfo: ${moveComponents.squareInfo}`);
            return -1;
        }
        
        else if(validPieces.length == 1)
            return validPieces[0];
        
        else {
            console.log(MUST_SPECIFY_PIECE);
            return -1;
        }
    }

    //no starting square info; now check for pieces in range. If only 1, return that piece
    for(square of pieceList){
        if (inPieceRange(square, moveComponents.destination, moveComponents.piece))
            validPieces.push(square);
    }

    if(validPieces.length == 0){
        console.log(NONE_IN_RANGE);
        return -1;
    }
    else if (validPieces.length == 1)
        return validPieces[0];
    
    //If more than 1 piece in range and piece is Knight, no need to check for blocking
    else if(moveComponents.piece === 'N'){
        console.log(MUST_SPECIFY_PIECE);
        return -1;
    }

    //More than 1 piece is in range; now check for blocking. If only 1 piece not blocked, return that piece
    else {
        let unfetteredPiece;

        for(square of validPieces){
            if(isBlocked(square, moveComponents.destination) == false){
                if(unfetteredPiece == undefined)
                    unfetteredPiece = square;
                
                else {
                    console.log(MUST_SPECIFY_PIECE);
                    return -1;
                }
            }
        }

        if(unfetteredPiece != undefined) return unfetteredPiece;

        console.log(ALL_PIECES_BLOCKED);
        return -1;
    }
}

function inPieceRange(start, dest, piece){
    
    coordinates = getNumericCoordinates(start, dest);
    
    if(piece.match('N'))
        return inKnightRange(coordinates);

    else if(piece.match(/[QR]/) && (sharesColumn(coordinates) || sharesRow(coordinates)))
        return true;
    
    else if(piece.match(/[QB]/) && sharesDiagonal(coordinates))
        return true;
    
    return false;
}

function inKnightRange(coordinates){
    
    let diffCol = Math.abs(coordinates.startCol - coordinates.destCol);
    let diffRow = Math.abs(coordinates.startRow - coordinates.destRow);

    if(diffRow == 0 || diffCol == 0) return false;

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

function isBlocked(start, dest){
    coordinates = getNumericCoordinates(start, dest);

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
    while((coordinates.destRow == checkRow && coordinates.destCol == checkCol) == false){
        
        //if square is occupied
        if(board[columns[checkCol]][checkRow] !== '--')
            return true;
        
        checkRow += rowDir;
        checkCol += colDir;
    }

    //squares have clear line of sight to each other; unblocked
    return false;
}

function trimSAN(sanMove){
    return sanMove.replace('x', '').replace('=', '');
}