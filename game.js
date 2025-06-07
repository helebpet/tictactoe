// Fix heart and flower centering, sizing, and colors to match palette and fit perfectly in the cell

const PALETTE = {
    electric: '#5c30ff',     // Heart (Player 1)
    chilli: '#e63c23',
    persian: '#f791c3',
    xanthous: '#f6bc3f',     // Flower center
    seagreen: '#008c47',     // Flower petal
    champagne: '#ffe8ce'
};

const COLORS = {
    board1: PALETTE.chilli,
    board2: PALETTE.persian,
    background: PALETTE.champagne,
    hover: PALETTE.seagreen + "33",
    winLine: PALETTE.xanthous,
    heart: PALETTE.electric,      // Blue for heart
    flowerPetal: PALETTE.seagreen, // Green for flower petals (was center)
    flowerCenter: PALETTE.seagreen // Green for center (was yellow)
};

const BOARD_SCALE_DESKTOP = 0.56;
const BOARD_SCALE_TABLET  = 0.84;
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
    const label2 = document.querySelector('label[for="player2Input"]');
    label1.textContent = mode === 'human' ? "Player 1 (Heart):" : "Enter your name:";
    label2.textContent = "Player 2 (Flower):";
    if (mode === 'human') {
        $player2Group.classList.remove('hidden');
    } else {
        $player2Group.classList.add('hidden');
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
    $resultText.style.color = COLORS.board1;
    $resultText.style.fontSize = "min(5vw, 24px)"; // Match CSS
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
    textFont('Geist Mono, JetBrains Mono, Fira Mono, monospace');
    textStyle(BOLD);
    showMenu();
}

function draw() {
    background(COLORS.background);

    // Responsive board scaling
    calculateBoardMetrics();

    if (Game.active || Game.showWinHighlight) {
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
    let w = window.innerWidth, h = window.innerHeight;
    let scale;
    if (w < 700 || h < 700) {
        scale = BOARD_SCALE_MOBILE;
    } else if (w < 1050) {
        scale = BOARD_SCALE_TABLET;
    } else {
        scale = BOARD_SCALE_DESKTOP;
    }
    Game.boardSize = Math.min(w, h) * scale;
    Game.boardSize = Math.max(Game.boardSize, 240);
    Game.boardSize = Math.min(Game.boardSize, 620);
    Game.cellSize = Game.boardSize / 3;
    Game.boardX = (w - Game.boardSize) / 2;
    Game.boardY = (h - Game.boardSize) / 2;
}

function drawBoard() {
    noStroke();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let x = Game.boardX + j * Game.cellSize;
            let y = Game.boardY + i * Game.cellSize;
            fill((i + j) % 2 === 0 ? COLORS.board1 : COLORS.board2);
            rect(x, y, Game.cellSize, Game.cellSize);

            // Hover highlight
            if (Game.active && isValidMove(i, j) && (isMouseOverCell(i, j) || isTouchOverCell(i, j))) {
                fill(COLORS.hover);
                rect(x, y, Game.cellSize, Game.cellSize);
            }
        }
    }
}

function drawMarks() {
    // Adjust size to fit cells perfectly
    let size = Game.cellSize * 0.45; // Make symbols smaller to match screenshot
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let cx = Game.boardX + j * Game.cellSize + Game.cellSize / 2;
            let cy = Game.boardY + i * Game.cellSize + Game.cellSize / 2;
            let mark = Game.board[i][j];
            if (mark === 'X') {
                drawHeartSymbol(cx, cy, size);
            } else if (mark === 'O') {
                drawFlowerSymbol(cx, cy, size);
            }
        }
    }
}

// Draw a simple heart shape centered in cell
function drawHeartSymbol(x, y, size) {
    push();
    translate(x, y);
    fill(COLORS.heart);
    noStroke();
    beginShape();
    // Simpler heart curve that matches screenshot exactly
    for (let t = 0; t < TWO_PI; t += 0.01) {
        let px = 16 * pow(sin(t), 3);
        let py = -(13 * cos(t) - 5 * cos(2*t) - 2 * cos(3*t) - cos(4*t));
        vertex(px * size/30, py * size/30);
    }
    endShape(CLOSE);
    pop();
}

// Draw a simple 5-petal flower centered in cell
function drawFlowerSymbol(x, y, size) {
    push();
    translate(x, y);
    noStroke();
    
    // Green petals
    fill(COLORS.flowerPetal);
    for (let i = 0; i < 5; i++) {
        let angle = TWO_PI * i / 5;
        let px = cos(angle) * size * 0.4;
        let py = sin(angle) * size * 0.4;
        circle(px, py, size * 0.5);
    }
    
    // Green center (same color as petals)
    fill(COLORS.flowerCenter);
    circle(0, 0, size * 0.6);
    
    pop();
}

function drawWinLine() {
    if (!Game.winLine) return;
    const {start, end} = Game.winLine;
    let x1 = Game.boardX + start.col * Game.cellSize + Game.cellSize / 2;
    let y1 = Game.boardY + start.row * Game.cellSize + Game.cellSize / 2;
    let x2 = Game.boardX + end.col * Game.cellSize + Game.cellSize / 2;
    let y2 = Game.boardY + end.row * Game.cellSize + Game.cellSize / 2;

    strokeWeight(Game.cellSize * 0.15);
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