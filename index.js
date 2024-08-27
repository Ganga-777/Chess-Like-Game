const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const gameState = {
    board: Array(25).fill(null),
    currentPlayer: 'A',
    moveHistory: []
};

function initializeGame() {
    gameState.board = [
        'A-P1', 'A-P2', 'A-H1', 'A-H2', 'A-H3',
        null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null,
        'B-P1', 'B-P2', 'B-H1', 'B-H2', 'B-H3'
    ];
    gameState.currentPlayer = 'A';
    gameState.moveHistory = [];
}

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('gameState', gameState);

    socket.on('move', (data) => {
        console.log('Move received:', data);
        if (isValidMove(data.piece, data.index, data.move)) {
            applyMove(data.piece, data.index, data.move);
            gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
            gameState.moveHistory.push(`${data.piece}:${data.move}`);
            io.emit('gameState', gameState);
        } else {
            console.log('Invalid move');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

function isValidMove(piece, index, move) {
    const [player, type] = piece.split('-');
    const targetIndex = getTargetIndex(index, move);

    if (targetIndex < 0 || targetIndex >= 25) return false;

    switch (type) {
        case 'P':
            return ['L', 'R', 'F', 'B'].includes(move);
        case 'H1':
            return ['L', 'R', 'F', 'B'].includes(move) && isClearPath(index, targetIndex);
        case 'H2':
            return ['FL', 'FR', 'BL', 'BR'].includes(move) && isClearPath(index, targetIndex);
        case 'H3':
            return ['FL', 'FR', 'BL', 'BR', 'RF', 'RB', 'LF', 'LB'].includes(move) && isClearPath(index, targetIndex);
        default:
            return false;
    }
}

function getTargetIndex(index, move) {
    switch (move) {
        case 'L': return index - 1;
        case 'R': return index + 1;
        case 'F': return index - 5;
        case 'B': return index + 5;
        case 'FL': return index - 6;
        case 'FR': return index - 4;
        case 'BL': return index + 4;
        case 'BR': return index + 6;
        case 'RF': return index + 1 - 5;
        case 'RB': return index + 1 + 5;
        case 'LF': return index - 1 - 5;
        case 'LB': return index - 1 + 5;
        default: return -1;
    }
}

function isClearPath(fromIndex, toIndex) {
    // Implement path checking logic here
    return true; // Placeholder
}

function applyMove(piece, fromIndex, move) {
    const toIndex = getTargetIndex(fromIndex, move);
    gameState.board[toIndex] = piece;
    gameState.board[fromIndex] = null;
}

initializeGame();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});