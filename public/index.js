const BG_COLOUR = '#000000';
const SNAKE_COLOUR = '#c2c2c2';
const SNAKE2_COLOUR = '#ec7063';
const FOOD_COLOUR = '#e66916';

// Socket.io client-side
const socket = io('http://snakecloneio.onrender.com');
socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const gameInfo = document.getElementById('gameInfo');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const winPopup = document.getElementById('winPopup');
const losePopup = document.getElementById('losePopup');
const resetBtn1 = document.getElementById('resetButton1');
const resetBtn2 = document.getElementById('resetButton2');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);
resetBtn1.addEventListener('click', reset);
resetBtn2.addEventListener('click', reset);

function newGame() {
    socket.emit('newGame');
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

// Initialize the canvas
function init() {
    initialScreen.style.display = "none";
    gameInfo.style.display = "none";
    winPopup.style.display = "none";
    losePopup.style.display = "none";
    gameScreen.style.display = "block";

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener('keydown', keydown);
    gameActive = true;
}

// Send keyboard input to server
function keydown(e) {
    socket.emit('keydown', e.code);
}

// Render the game
function paintGame(state) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    ctx.fillStyle = FOOD_COLOUR;
    ctx.fillRect(food.x * size, food.y * size, size, size);

    paintPlayer(state.players[0], size, SNAKE_COLOUR);
    paintPlayer(state.players[1], size, SNAKE2_COLOUR);
}

function paintPlayer(playerState, size, colour) {
    const snake = playerState.snake;
    ctx.fillStyle = colour;

    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleInit(number) {
    playerNumber = number;
}

// Send game state to the server
function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }

    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {

    if (!gameActive) {
        return;
    }

    if (data.winner === playerNumber) {
        winPopup.style.display = "block";
    } else {
        losePopup.style.display = "block";
    }

    gameActive = false;
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
    alert('Unknown Game Code')
    reset();
}

function handleTooManyPlayers() {
    reset();
    alert('This game is already in progress');
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = '';
    initialScreen.style.display = "block";
    gameInfo.style.display = "block";
    gameScreen.style.display = "none";
}