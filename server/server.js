const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');

// Setup server
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const PORT = 3000 || process.env.PORT; // process.env.PORT is related to deploying on Heroku

// Set static directory
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Setup socket.io
const { Server } = require('socket.io');
const io = new Server(server);

// Socket.io server-side
const state = {};
const clientRooms = {};

io.on('connection', client => {
    console.log('New client has connected with id: ' + client.id);

    client.on('keydown', handleKeyDown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);

    function handleNewGame() {
        let roomName = makeid(5);
        clientRooms[client.id] = roomName;
        client.emit('gameCode', roomName);

        state[roomName] = initGame();

        client.join(roomName);
        client.number = 1;
        client.emit('init', 1);
    }

    function handleJoinGame(roomName) {
        const room = io.sockets.adapter.rooms.get(roomName);

        let numClients = 0;
        if (room) {
            numClients = room.size;
        }

        if (numClients === 0) {
            client.emit('unknownCode');
            return;
        } else if (numClients > 1) {
            client.emit('tooManyPlayers');
            return;
        }


        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = 2;
        client.emit('init', 2);

        startGameInterval(roomName);
    }

    // Handling player input
    function handleKeyDown(key) {
        const roomName = clientRooms[client.id];

        if (!roomName) {
            return;
        }

        const vel = getUpdatedVelocity(key);

        if (vel) {
            state[roomName].players[client.number - 1].vel = vel;
        }
    }
});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);

        if (!winner) {
            emitGameState(roomName, state[roomName]);

        } else {
            emitGameOver(roomName, winner);
            state[roomName] == null;
            clearInterval(intervalId);
        }

    }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
    io.sockets.in(roomName).emit('gameState', state);
}

function emitGameOver(roomName, winner) {
    io.sockets.in(roomName).emit('gameOver', { winner });
}

server.listen(PORT);