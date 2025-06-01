// Responsive, bold Tic Tac Toe with sharp cells, big modern font, and edge timers
// Single player: only "Enter your name" field

const COLORS = {
    board1: '#D9F201',    // Lime green
    board2: '#FA87A0',    // Pink
    text: '#0D0D55',      // Navy blue
    background: '#FFFFFF', // White
    hover: '#5271FF',     // Bright blue (with opacity for hover)
    winLine: '#0D0D55',   // Navy blue
    highlight: '#5271FF'  // Bright blue for winning cells
};

const BOARD_SCALE_DESKTOP = 0.65;
const BOARD_SCALE_MOBILE  = 0.98;
const TURN_TIME_LIMIT = 10;
const WIN_HIGHLIGHT_DELAY = 1200;
const ROBOT_NAMES = [
    "ThinkBot", "SmartBot", "LogicBot", "WinBot", "TacBot",
    "StrategyBot", "CleverBot", "MindBot", "GeniusBot", "ProBot"
];

const Game = {
    mode: null,
    board: null,
    currentPlayer: 'X',
    winner: null,
    winLine: null,
    startMillis: 0,
    playerNames: { X: '', O: '' },
    robotThinking: false,
    active: false,
    boardSize: 0,
    cellSize: 0,
    boardX: 0,
    boardY: 0,
    winCells: [],
    showWinHighlight: false,
    gameStartTime: null
};

const $menuScreen = document.getElementById('menuScreen');
const $nameScreen = document.getElementById('nameScreen');
const $gameOverScreen = document.getElementById('gameOverScreen');
const $player1Input = document.getElementById('player1Input');
const $player2Input = document.getElementById('player2Input');
const $player2Group = document.getElementById('player2Group');
const $resultText = document.getElementById('resultText');
const $btnHuman = document.getElementById('btnHuman');
const $btnRobot = document.getElementById('btnRobot');
const $btnStartGame = document.getElementById('btnStartGame');
const $btnPlayAgain = document.getElementById('btnPlayAgain');
const $btnBackToMenu = document.getElementById('btnBackToMenu');

let timerP1, timerP2;

document.addEventListener('DOMContentLoaded', () => {
    setupEdgeTimers();
    Game.gameStartTime = getCurrentUTCDateTime();
});

function setupEdgeTimers() {
    timerP1 = document.getElementById('timerP1');
    timerP2 = document.getElementById('timerP2');
    if (!timerP1) {
        timerP1 = document.createElement('div');
        timerP1.id = 'timerP1';
        timerP1.className = 'timer-edge hidden';
        document.body.appendChild(timerP1);
    }
    if (!timerP2) {
        timerP2 = document.createElement('div');
        timerP2.id = 'timerP2';
        timerP2.className = 'timer-edge hidden';
        document.body.appendChild(timerP2);
    }
}

function showEdgeTimers() {
    timerP1.classList.remove('hidden');
    timerP2.classList.remove('hidden');
}
function hideEdgeTimers() {
    timerP1.classList.add('hidden');
    timerP2.classList.add('hidden');
}

function hideAllScreens() {
    $menuScreen.classList.add('hidden');
    $nameScreen.classList.add('hidden');
    $gameOverScreen.classList.add('hidden');
    hideEdgeTimers();
}

function showMenu() {
    hideAllScreens();
    $menuScreen.classList.remove('hidden');
    Game.active = false;
    Game.showWinHighlight = false;
}

function showNameEntry(mode) {
    Game.mode = mode;
    hideAllScreens();
    const label1 = document.querySelector('label[for="player1Input"]');
    if (mode === 'human') {
        $player2Group.classList.remove('hidden');
        label1.textContent = "Player 1 (X):";
    } else {
        $player2Group.classList.add('hidden');
        label1.textContent = "Enter your name:";
    }
    $nameScreen.classList.remove('hidden');
    $player1Input.focus();
}

function startGame() {
    Game.playerNames.X = $player1Input.value.trim() || 'Player 1';
    Game.playerNames.O = Game.mode === 'human'
        ? ($player2Input.value.trim() || 'Player 2')
        : randomChoice(ROBOT_NAMES);
    initializeGame();
    hideAllScreens();
    showEdgeTimers();
}

function resetGame() {
    initializeGame();
    hideAllScreens();
    showEdgeTimers();
}

function initializeGame() {
    Game.board = Array.from({ length: 3 }, () => ['', '', '']);
    Game.currentPlayer = 'X';
    Game.winner = null;
    Game.winLine = null;
    Game.winCells = [];
    Game.startMillis = millis();
    Game.robotThinking = false;
    Game.active = true;
    Game.showWinHighlight = false;
}

function endGame(message) {
    Game.active = false;
    hideEdgeTimers();
    let text = '';
    if (message) {
        text = message;
    } else if (Game.winner === 'tie') {
        text = "It's a tie!";
    } else {
        let winnerName = Game.playerNames[Game.winner] || 'Player';
        text = `${winnerName} wins!`;
    }
    $resultText.textContent = text;
    $gameOverScreen.classList.remove('hidden');
}

$btnHuman.addEventListener('click', () => showNameEntry('human'));
$btnRobot.addEventListener('click', () => showNameEntry('robot'));
$btnStartGame.addEventListener('click', startGame);
$btnPlayAgain.addEventListener('click', resetGame);
$btnBackToMenu.addEventListener('click', showMenu);
$nameScreen.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startGame();
});

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont('Kumbh Sans');
    textStyle(BOLD);
    showMenu();
}

function draw() {
    background(COLORS.background);

    if (Game.active || Game.showWinHighlight) {
        calculateBoardMetrics();
        drawBoard();
        drawMarks();
        if (Game.winLine) drawWinLine();
        if (Game.active) {
            updateEdgeTimers();
            checkTimeLimit();
        }
    }
}

function calculateBoardMetrics() {
    let isMobile = window.innerWidth < 700 || window.innerHeight < 700;
    let boardScale = isMobile ? BOARD_SCALE_MOBILE : BOARD_SCALE_DESKTOP;
    Game.boardSize = Math.min(windowWidth, windowHeight) * boardScale;
    Game.boardSize = Math.max(Game.boardSize, 240);
    Game.boardSize = Math.min(Game.boardSize, 620);
    Game.cellSize = Game.boardSize / 3;
    Game.boardX = (windowWidth - Game.boardSize) / 2;
    Game.boardY = (windowHeight - Game.boardSize) / 2;
}

function drawBoard() {
    noStroke();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let x = Game.boardX + j * Game.cellSize;
            let y = Game.boardY + i * Game.cellSize;

            let isWinCell = Game.winCells.some(([wi, wj]) => wi === i && wj === j);

            if (Game.showWinHighlight && isWinCell) {
                fill(COLORS.highlight);
            } else {
                fill((i + j) % 2 === 0 ? COLORS.board1 : COLORS.board2);
            }
            rect(x, y, Game.cellSize, Game.cellSize); // SHARP CORNERS

            if (Game.active && isValidMove(i, j) && (isMouseOverCell(i, j) || isTouchOverCell(i, j))) {
                fill(COLORS.hover + '33');
                rect(x, y, Game.cellSize, Game.cellSize);
            }
        }
    }
}

function drawMarks() {
    let fontSize = Game.cellSize * 0.68;
    textFont('Kumbh Sans');
    textStyle(BOLD);
    textSize(fontSize);
    textAlign(CENTER, CENTER);
    fill(COLORS.text);
    noStroke();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (Game.board[i][j] !== '') {
                let cx = Game.boardX + j * Game.cellSize + Game.cellSize / 2;
                let cy = Game.boardY + i * Game.cellSize + Game.cellSize / 2 + 3;
                text(Game.board[i][j], cx, cy);
            }
        }
    }
}

function drawWinLine() {
    if (!Game.winLine) return;
    const {start, end} = Game.winLine;
    let x1 = Game.boardX + start.col * Game.cellSize + Game.cellSize / 2;
    let y1 = Game.boardY + start.row * Game.cellSize + Game.cellSize / 2;
    let x2 = Game.boardX + end.col * Game.cellSize + Game.cellSize / 2;
    let y2 = Game.boardY + end.row * Game.cellSize + Game.cellSize / 2;

    strokeWeight(Game.cellSize * 0.19);
    stroke(COLORS.hover);
    line(x1, y1, x2, y2);

    strokeWeight(Game.cellSize * 0.09);
    stroke(COLORS.winLine);
    line(x1, y1, x2, y2);

    strokeWeight(1);
}

function mousePressed() {
    if (!Game.active || Game.winner !== null) return;
    if (Game.mode === 'robot' && Game.currentPlayer === 'O') return;
    handleTap(mouseX, mouseY);
}

function touchStarted() {
    if (!Game.active || Game.winner !== null) return;
    if (Game.mode === 'robot' && Game.currentPlayer === 'O') return;
    let x = touches.length > 0 ? touches[0].x : mouseX;
    let y = touches.length > 0 ? touches[0].y : mouseY;
    handleTap(x, y);
    return false;
}

function handleTap(x, y) {
    let i = Math.floor((y - Game.boardY) / Game.cellSize);
    let j = Math.floor((x - Game.boardX) / Game.cellSize);
    if (i >= 0 && i < 3 && j >= 0 && j < 3 && isValidMove(i, j)) {
        makeMove(i, j);
    }
}

function isTouchOverCell(i, j) {
    if (!touches || touches.length === 0) return false;
    let t = touches[0];
    let x = Game.boardX + j * Game.cellSize;
    let y = Game.boardY + i * Game.cellSize;
    return t.x > x && t.x < x + Game.cellSize &&
           t.y > y && t.y < y + Game.cellSize;
}

function isMouseOverCell(i, j) {
    let x = Game.boardX + j * Game.cellSize;
    let y = Game.boardY + i * Game.cellSize;
    return mouseX > x && mouseX < x + Game.cellSize &&
           mouseY > y && mouseY < y + Game.cellSize;
}

let cursor = { i: 0, j: 0 };
function keyPressed() {
    if (!Game.active || Game.winner !== null) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)) {
        if (key === 'ArrowUp') cursor.i = (cursor.i + 2) % 3;
        if (key === 'ArrowDown') cursor.i = (cursor.i + 1) % 3;
        if (key === 'ArrowLeft') cursor.j = (cursor.j + 2) % 3;
        if (key === 'ArrowRight') cursor.j = (cursor.j + 1) % 3;
        if (key === ' ' && isValidMove(cursor.i, cursor.j)) {
            makeMove(cursor.i, cursor.j);
        }
        return false;
    }
}

function isValidMove(i, j) {
    return Game.board[i][j] === '' && Game.winner === null &&
           (Game.mode === 'human' || (Game.mode === 'robot' && Game.currentPlayer === 'X'));
}

function makeMove(i, j) {
    if (Game.board[i][j] !== '') return;
    Game.board[i][j] = Game.currentPlayer;
    Game.winner = checkWinnerAndCells();
    if (Game.winner !== null) {
        if (Game.winner === 'tie') {
            endGame();
        } else {
            Game.showWinHighlight = true;
            Game.active = false;
            setTimeout(() => {
                endGame();
            }, WIN_HIGHLIGHT_DELAY);
        }
    } else {
        switchPlayer();
    }
}

function switchPlayer() {
    Game.currentPlayer = Game.currentPlayer === 'X' ? 'O' : 'X';
    Game.startMillis = millis();
    if (Game.mode === 'robot' && Game.currentPlayer === 'O' && !Game.robotThinking) {
        Game.robotThinking = true;
        setTimeout(() => {
            if (Game.winner === null && Game.currentPlayer === 'O' && Game.active) {
                makeRobotMove();
            }
            Game.robotThinking = false;
        }, 800);
    }
}

function makeRobotMove() {
    let move = findBestMove();
    if (move) makeMove(move.i, move.j);
}

function findBestMove() {
    // Try to win
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (Game.board[i][j] === '') {
            Game.board[i][j] = 'O';
            let tempWinner = checkWinnerAndCells();
            Game.board[i][j] = '';
            if (tempWinner === 'O') return { i, j };
        }
    }
    // Block opponent
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (Game.board[i][j] === '') {
            Game.board[i][j] = 'X';
            let tempWinner = checkWinnerAndCells();
            Game.board[i][j] = '';
            if (tempWinner === 'X') return { i, j };
        }
    }
    // Take center
    if (Game.board[1][1] === '') return { i: 1, j: 1 };
    // Take corner
    let corners = [{i:0,j:0}, {i:0,j:2}, {i:2,j:0}, {i:2,j:2}];
    for (let corner of corners) {
        if (Game.board[corner.i][corner.j] === '') return corner;
    }
    // Take any available
    let available = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
        if (Game.board[i][j] === '') available.push({ i, j });
    return available.length > 0 ? randomChoice(available) : null;
}

function checkWinnerAndCells() {
    Game.winCells = [];
    // Check rows
    for (let i = 0; i < 3; i++) {
        if (Game.board[i][0] !== '' &&
            Game.board[i][0] === Game.board[i][1] &&
            Game.board[i][1] === Game.board[i][2]) {
            Game.winLine = {start: {row: i, col: 0}, end: {row: i, col: 2}};
            Game.winCells = [[i,0], [i,1], [i,2]];
            return Game.board[i][0];
        }
    }
    // Check columns
    for (let j = 0; j < 3; j++) {
        if (Game.board[0][j] !== '' &&
            Game.board[0][j] === Game.board[1][j] &&
            Game.board[1][j] === Game.board[2][j]) {
            Game.winLine = {start: {row: 0, col: j}, end: {row: 2, col: j}};
            Game.winCells = [[0,j], [1,j], [2,j]];
            return Game.board[0][j];
        }
    }
    // Check diagonals
    if (Game.board[0][0] !== '' &&
        Game.board[0][0] === Game.board[1][1] &&
        Game.board[1][1] === Game.board[2][2]) {
        Game.winLine = {start: {row: 0, col: 0}, end: {row: 2, col: 2}};
        Game.winCells = [[0,0], [1,1], [2,2]];
        return Game.board[0][0];
    }
    if (Game.board[0][2] !== '' &&
        Game.board[0][2] === Game.board[1][1] &&
        Game.board[1][1] === Game.board[2][0]) {
        Game.winLine = {start: {row: 0, col: 2}, end: {row: 2, col: 0}};
        Game.winCells = [[0,2], [1,1], [2,0]];
        return Game.board[0][2];
    }
    // Check for tie
    if (!Game.board.flat().includes('')) {
        Game.winLine = null;
        return 'tie';
    }
    Game.winLine = null;
    return null;
}

function updateEdgeTimers() {
    if (!Game.active || Game.winner !== null) {
        hideEdgeTimers();
        return;
    }
    let elapsed = (millis() - Game.startMillis) / 1000;
    let remaining = Math.max(0, TURN_TIME_LIMIT - elapsed);
    let p1name = Game.playerNames.X;
    let p2name = Game.playerNames.O;
    let isMobile = window.innerWidth < 700 || window.innerHeight < 700;

    timerP1.textContent =
        `${p1name} (${Game.currentPlayer === 'X' ? '●' : ''}): ${Game.currentPlayer === 'X' ? remaining.toFixed(1) : ''}`;
    timerP1.className = 'timer-edge' + (Game.currentPlayer === 'X' ? ' active' : '');

    timerP2.textContent =
        `${p2name} (${Game.currentPlayer === 'O' ? '●' : ''}): ${Game.currentPlayer === 'O' ? remaining.toFixed(1) : ''}`;
    timerP2.className = 'timer-edge' + (Game.currentPlayer === 'O' ? ' active' : '');

    timerP1.style.top = isMobile ? '3vw' : `${Game.boardY + Game.boardSize/2 - timerP1.offsetHeight/2}px`;
    timerP1.style.left = isMobile ? '50%' : `max(4vw, 20px)`;
    timerP1.style.right = '';
    timerP1.style.transform = isMobile ? 'translate(-50%,0)' : '';

    timerP2.style.bottom = isMobile ? '3vw' : '';
    timerP2.style.top = isMobile ? '' : `${Game.boardY + Game.boardSize/2 - timerP2.offsetHeight/2}px`;
    timerP2.style.left = isMobile ? '50%' : '';
    timerP2.style.right = isMobile ? '' : `max(4vw, 20px)`;
    timerP2.style.transform = isMobile ? 'translate(-50%,0)' : '';
    showEdgeTimers();
}

function checkTimeLimit() {
    if (!Game.active || Game.winner !== null) return;
    let elapsed = (millis() - Game.startMillis) / 1000;
    if (elapsed > TURN_TIME_LIMIT) {
        let loser = Game.currentPlayer;
        let winner = Game.currentPlayer === 'X' ? 'O' : 'X';
        Game.winner = winner;
        endGame(`${Game.playerNames[loser]}'s time ran out! ${Game.playerNames[winner]} wins!`);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function millis() { 
    return window.performance.now(); 
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getCurrentUTCDateTime() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}