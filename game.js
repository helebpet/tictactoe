// Responsive & visually pleasing Tic Tac Toe with "timer on edges" and sharp cells

const CHECKERBOARD_THEMES = {
    normal: ['#D9F201', '#FA87A0'],
    blue:   ['#0D0D55', '#5271FF']
};
let checkerboardTheme = 'normal';

const COLORS = {
    board1: '#D9F201',
    board2: '#FA87A0',
    text: '#0D0D55',
    background: '#f8f8f8',
    hover: '#5271FF',
    winLine: '#0D0D55'
};
const BOARD_SCALE_DESKTOP = 0.6;
const BOARD_SCALE_MOBILE  = 0.96;
const TURN_TIME_LIMIT = 10;
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
};

// UI Selectors
const $menuScreen = document.getElementById('menuScreen');
const $nameScreen = document.getElementById('nameScreen');
const $gameOverScreen = document.getElementById('gameOverScreen');
const $player1Input = document.getElementById('player1Input');
const $player2Input = document.getElementById('player2Input');
const $player2Group = document.getElementById('player2Group');
const $robotMessage = document.getElementById('robotMessage');
const $resultText = document.getElementById('resultText');
const $btnHuman = document.getElementById('btnHuman');
const $btnRobot = document.getElementById('btnRobot');
const $btnStartGame = document.getElementById('btnStartGame');
const $btnPlayAgain = document.getElementById('btnPlayAgain');
const $btnBackToMenu = document.getElementById('btnBackToMenu');

let timerP1, timerP2;

// Checkerboard hover state logic
document.addEventListener('DOMContentLoaded', () => {
    const buttons = [
        ...document.querySelectorAll('.game-button')
    ];
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', handleBorderBlue);
        btn.addEventListener('focus', handleBorderBlue);
        btn.addEventListener('mouseleave', handleBorderNormal);
        btn.addEventListener('blur', handleBorderNormal);
        btn.addEventListener('touchstart', handleBorderBlue, {passive:true});
        btn.addEventListener('touchend', handleBorderNormal, {passive:true});
        btn.addEventListener('touchcancel', handleBorderNormal, {passive:true});
    });
    setupEdgeTimers();
});

function setupEdgeTimers() {
    // Create timer elements if they don't exist
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
function handleBorderBlue() { checkerboardTheme = 'blue'; }
function handleBorderNormal() { checkerboardTheme = 'normal'; }

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
}
function showNameEntry(mode) {
    Game.mode = mode;
    hideAllScreens();
    if (mode === 'human') {
        $player2Group.classList.remove('hidden');
        $robotMessage.classList.add('hidden');
    } else {
        $player2Group.classList.add('hidden');
        $robotMessage.classList.remove('hidden');
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
    Game.startMillis = millis();
    Game.robotThinking = false;
    Game.active = true;
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

// --- p5.js Setup & Draw ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont('monospace');
    textStyle(BOLD);
    showMenu();
}
function draw() {
    if (
        !$menuScreen.classList.contains('hidden') ||
        !$nameScreen.classList.contains('hidden') ||
        !$gameOverScreen.classList.contains('hidden')
    ) {
        drawCheckerboardBorder();
    } else {
        background(255);
    }
    if (Game.active) {
        calculateBoardMetrics();
        drawBoard();
        drawMarks();
        if (Game.winLine) drawWinLine();
        updateEdgeTimers();
        checkTimeLimit();
    }
}
function calculateBoardMetrics() {
    let isMobile = window.innerWidth < 700 || window.innerHeight < 700;
    let boardScale = isMobile ? BOARD_SCALE_MOBILE : BOARD_SCALE_DESKTOP;
    Game.boardSize = Math.min(windowWidth, windowHeight) * boardScale;
    Game.boardSize = Math.max(Game.boardSize, 240);
    Game.boardSize = Math.min(Game.boardSize, 600);
    Game.cellSize = Game.boardSize / 3;
    Game.boardX = (windowWidth - Game.boardSize) / 2;
    Game.boardY = (windowHeight - Game.boardSize) / 2;
}
function drawCheckerboardBorder() {
    background(255);
    let [color1, color2] = CHECKERBOARD_THEMES[checkerboardTheme];
    let minTiles = 10, maxTiles = 24;
    let nTilesX = Math.max(minTiles, Math.min(maxTiles, Math.floor(windowWidth / 40)));
    let nTilesY = Math.max(minTiles, Math.min(maxTiles, Math.floor(windowHeight / 40)));
    let tileSizeX = windowWidth / nTilesX;
    let tileSizeY = windowHeight / nTilesY;
    let border = 2;
    noStroke();
    for (let i = 0; i < nTilesY; i++) {
        for (let j = 0; j < nTilesX; j++) {
            if (
                i < border || i >= nTilesY - border ||
                j < border || j >= nTilesX - border
            ) {
                fill((i + j) % 2 === 0 ? color1 : color2);
                rect(j * tileSizeX, i * tileSizeY, tileSizeX, tileSizeY);
            }
        }
    }
}
function drawBoard() {
    noStroke();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let x = Game.boardX + j * Game.cellSize;
            let y = Game.boardY + i * Game.cellSize;
            fill((i + j) % 2 === 0 ? COLORS.board1 : COLORS.board2);
            rect(x, y, Game.cellSize, Game.cellSize); // sharp, no radius
            // Hover/tap effect
            if (isValidMove(i, j) && (isMouseOverCell(i, j) || isTouchOverCell(i, j))) {
                fill(COLORS.hover + '44');
                rect(x, y, Game.cellSize, Game.cellSize);
            }
        }
    }
}
function drawMarks() {
    let fontSize = Game.cellSize * 0.55;
    textSize(fontSize);
    textAlign(CENTER, CENTER);
    fill(COLORS.text);
    noStroke();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (Game.board[i][j] !== '') {
                let cx = Game.boardX + j * Game.cellSize + Game.cellSize / 2;
                let cy = Game.boardY + i * Game.cellSize + Game.cellSize / 2;
                text(Game.board[i][j], cx, cy + 2);
            }
        }
    }
}
function drawWinLine() {
    let {start, end} = Game.winLine;
    let x1 = Game.boardX + start.col * Game.cellSize + Game.cellSize / 2;
    let y1 = Game.boardY + start.row * Game.cellSize + Game.cellSize / 2;
    let x2 = Game.boardX + end.col * Game.cellSize + Game.cellSize / 2;
    let y2 = Game.boardY + end.row * Game.cellSize + Game.cellSize / 2;
    stroke(COLORS.winLine);
    strokeWeight(8);
    line(x1, y1, x2, y2);
}

// --- Mouse, Touch & Keyboard ---
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
    Game.winner = checkWinner();
    if (Game.winner !== null) {
        endGame();
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
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (Game.board[i][j] === '') {
            Game.board[i][j] = 'O';
            let tempWinner = checkWinner();
            Game.board[i][j] = '';
            if (tempWinner === 'O') return { i, j };
        }
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (Game.board[i][j] === '') {
            Game.board[i][j] = 'X';
            let tempWinner = checkWinner();
            Game.board[i][j] = '';
            if (tempWinner === 'X') return { i, j };
        }
    }
    if (Game.board[1][1] === '') return { i: 1, j: 1 };
    let corners = [{i:0,j:0}, {i:0,j:2}, {i:2,j:0}, {i:2,j:2}];
    for (let corner of corners) {
        if (Game.board[corner.i][corner.j] === '') return corner;
    }
    let available = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
        if (Game.board[i][j] === '') available.push({ i, j });
    return available.length > 0 ? randomChoice(available) : null;
}
function checkWinner() {
    for (let i = 0; i < 3; i++) {
        if (Game.board[i][0] !== '' &&
            Game.board[i][0] === Game.board[i][1] &&
            Game.board[i][1] === Game.board[i][2]) {
            Game.winLine = {start: {row: i, col: 0}, end: {row: i, col: 2}};
            return Game.board[i][0];
        }
    }
    for (let j = 0; j < 3; j++) {
        if (Game.board[0][j] !== '' &&
            Game.board[0][j] === Game.board[1][j] &&
            Game.board[1][j] === Game.board[2][j]) {
            Game.winLine = {start: {row: 0, col: j}, end: {row: 2, col: j}};
            return Game.board[0][j];
        }
    }
    if (Game.board[0][0] !== '' &&
        Game.board[0][0] === Game.board[1][1] &&
        Game.board[1][1] === Game.board[2][2]) {
        Game.winLine = {start: {row: 0, col: 0}, end: {row: 2, col: 2}};
        return Game.board[0][0];
    }
    if (Game.board[0][2] !== '' &&
        Game.board[0][2] === Game.board[1][1] &&
        Game.board[1][1] === Game.board[2][0]) {
        Game.winLine = {start: {row: 0, col: 2}, end: {row: 2, col: 0}};
        return Game.board[0][2];
    }
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

    // Timer for X (player 1)
    timerP1.textContent =
        `${p1name} (${Game.currentPlayer === 'X' ? '●' : ''}): ${Game.currentPlayer === 'X' ? remaining.toFixed(1) : ''}`;
    timerP1.className = 'timer-edge' + (Game.currentPlayer === 'X' ? ' active' : '');

    // Timer for O (player 2)
    timerP2.textContent =
        `${p2name} (${Game.currentPlayer === 'O' ? '●' : ''}): ${Game.currentPlayer === 'O' ? remaining.toFixed(1) : ''}`;
    timerP2.className = 'timer-edge' + (Game.currentPlayer === 'O' ? ' active' : '');

    // Position: handled by CSS
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
function millis() { return window.performance.now(); }
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}