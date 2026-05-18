// Get canvas and context
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const aiToggleButton = document.getElementById('aiToggle');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Overlay elements
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const btnPlayerMode = document.getElementById('btnPlayerMode');
const btnAiMode = document.getElementById('btnAiMode');

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
const NEXT_BOX_SIZE = 4;
const AI_DELAY = 100; // Delay in milliseconds for AI moves

context.canvas.width = COLS * BLOCK_SIZE;
context.canvas.height = ROWS * BLOCK_SIZE;
nextContext.canvas.width = NEXT_BOX_SIZE * BLOCK_SIZE;
nextContext.canvas.height = NEXT_BOX_SIZE * BLOCK_SIZE;

// Tetrominoes and colors
const COLORS = [
    null, 
    '#00e5ff', // I - Cyan
    '#0055ff', // O - Blue
    '#ffaa00', // T - Orange
    '#ffe600', // S - Yellow
    '#00ff44', // Z - Green
    '#b52dff', // L - Purple
    '#ff2d75'  // J - Neon Pink
];

const SHAPES = [
    [], // Empty shape
    [[1, 1, 1, 1]], // I
    [[2, 2], [2, 2]],   // O
    [[0, 3, 0], [3, 3, 3]], // T
    [[4, 4, 0], [0, 4, 4]], // S
    [[0, 5, 5], [5, 5, 0]], // Z
    [[6, 0, 0], [6, 6, 6]], // L
    [[0, 0, 7], [7, 7, 7]]  // J
];

// Game state
let board;
let score;
let piece;
let nextPiece;
let isAiActive = true;
let isGameOver = false;
let dropCounter = 0;
let dropInterval = 1000; // ms for player drop
let animationId;

// --- Menus & Overlays ---

function showMenu(title, subtitle, isLost = false) {
    overlay.classList.remove('game-over');
    if (isLost) overlay.classList.add('game-over');
    
    overlayTitle.textContent = title;
    overlaySubtitle.textContent = subtitle;
    overlay.classList.add('active');
    cancelAnimationFrame(animationId);
}

function hideMenu() {
    overlay.classList.remove('active');
}

btnPlayerMode.addEventListener('click', () => {
    isAiActive = false;
    aiToggleButton.textContent = 'Player Mode';
    aiToggleButton.classList.add('player-mode');
    hideMenu();
    init();
});

btnAiMode.addEventListener('click', () => {
    isAiActive = true;
    aiToggleButton.textContent = 'AI is ON';
    aiToggleButton.classList.remove('player-mode');
    hideMenu();
    init();
});

function updateStatusUI() {
    statusDot.classList.remove('paused', 'game-over');
    if (isGameOver) {
        statusDot.classList.add('game-over');
        statusText.textContent = 'Game Over';
    } else if (isAiActive) {
        statusText.textContent = 'AI Running';
    } else {
        statusText.textContent = 'Player Mode';
    }
}

// --- Visual Helper: Rounded Rectangle ---
function drawRoundedRect(ctx, px, py, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + w - r, py);
    ctx.arcTo(px + w, py, px + w, py + r, r);
    ctx.lineTo(px + w, py + h - r);
    ctx.arcTo(px + w, py + h, px + w - r, py + h, r);
    ctx.lineTo(px + r, py + h);
    ctx.arcTo(px, py + h, px, py + h - r, r);
    ctx.lineTo(px, py + r);
    ctx.arcTo(px, py, px + r, py, r);
    ctx.closePath();
}

function drawBlock(ctx, x, y, color) {
    const padding = 1;
    const size = BLOCK_SIZE - padding * 2;
    const radius = 3;
    const px = x * BLOCK_SIZE + padding;
    const py = y * BLOCK_SIZE + padding;

    // Inner neon block
    ctx.fillStyle = color;
    drawRoundedRect(ctx, px, py, size, size, radius);
    ctx.fill();

    // Subtle inset glow effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, px + 1, py + 1, size - 2, size - 2, radius - 1);
    ctx.stroke();
}

function drawGrid(ctx, cols, rows, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, height);
        ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const color = COLORS[value] || '#777';
                drawBlock(ctx, x + offset.x, y + offset.y, color);
            }
        });
    });
}

function draw() {
    // Main board
    context.fillStyle = '#050510';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(context, COLS, ROWS, canvas.width, canvas.height);
    
    if (board) {
        drawMatrix(board, { x: 0, y: 0 }, context);
    }
    if (piece) {
        drawMatrix(piece.matrix, { x: piece.x, y: piece.y }, context);
    }

    // Next piece
    nextContext.fillStyle = '#050510';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawGrid(nextContext, NEXT_BOX_SIZE, NEXT_BOX_SIZE, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = (NEXT_BOX_SIZE - nextPiece.matrix[0].length) / 2;
        const offsetY = (NEXT_BOX_SIZE - nextPiece.matrix.length) / 2;
        drawMatrix(nextPiece.matrix, { x: offsetX, y: offsetY }, nextContext);
    }
}

// --- Game Functions ---

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece(type) {
    const matrix = SHAPES[type];
    return {
        matrix: matrix,
        type: type,
        x: Math.floor(COLS / 2) - Math.floor(matrix[0].length / 2),
        y: 0
    };
}

function rotate(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const result = Array.from({ length: M }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            if (matrix[r][c]) {
                result[c][N - 1 - r] = matrix[r][c];
            }
        }
    }
    return result;
}

function collide(board, piece) {
    const { matrix, x, y } = piece;
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[0].length; col++) {
            if (matrix[row][col] &&
                (y + row >= ROWS || x + col < 0 || x + col >= COLS || (board[row + y] && board[row + y][col + x]) !== 0)) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.y][x + piece.x] = value;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        linesCleared++;
        y++;
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * (linesCleared > 1 ? linesCleared : 1);
        scoreElement.innerText = score;
    }
}

function pieceDrop() {
    piece.y++;
    if (collide(board, piece)) {
        piece.y--;
        merge(board, piece);
        clearLines();
        resetPiece();
    }
    dropCounter = 0;
}

function hardDrop() {
    while (!collide(board, piece)) {
        piece.y++;
    }
    piece.y--;
    merge(board, piece);
    clearLines();
    resetPiece();
}

function resetPiece() {
    piece = nextPiece;
    nextPiece = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
    
    if (collide(board, piece)) {
        // Game Over
        isGameOver = true;
        updateStatusUI();
        showMenu('GAME OVER', 'Score: ' + score, true);
        return;
    }
    
    if (isAiActive && !isGameOver) {
        setTimeout(aiMove, AI_DELAY);
    }
}

// AI LOGIC
function aiMove() {
    if (!piece || !isAiActive || isGameOver) return;
    let bestMove = findBestMove();
    if (bestMove) {
        piece.matrix = bestMove.matrix;
        piece.x = bestMove.x;
        hardDrop();
    }
}

function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    let currentPieceForSim = { ...piece };

    for (let rotation = 0; rotation < 4; rotation++) {
        for (let x = -2; x < COLS; x++) {
            let simPiece = { ...currentPieceForSim, x: x, y: 0 };
            
            // Check if horizontal position is valid before dropping
            let isHorizontallyValid = true;
            for(let r = 0; r < simPiece.matrix.length; r++){
                for(let c = 0; c < simPiece.matrix[0].length; c++){
                    if(simPiece.matrix[r][c] && (simPiece.x + c < 0 || simPiece.x + c >= COLS)){
                        isHorizontallyValid = false;
                        break;
                    }
                }
                if(!isHorizontallyValid) break;
            }
            if(!isHorizontallyValid) continue;


            // Simulate drop
            let simBoard = JSON.parse(JSON.stringify(board));
            while (!collide(simBoard, simPiece)) {
                simPiece.y++;
            }
            simPiece.y--;
            
            if (simPiece.y < 0) continue;

            merge(simBoard, simPiece);
            let score = calculateBoardScore(simBoard);

            if (score > bestScore) {
                bestScore = score;
                bestMove = { matrix: simPiece.matrix, x: simPiece.x };
            }
        }
        currentPieceForSim.matrix = rotate(currentPieceForSim.matrix);
    }
    return bestMove;
}


function calculateBoardScore(board) {
    let aggregateHeight = 0;
    let completedLines = 0;
    let holes = 0;
    let bumpiness = 0;
    let columnHeights = new Array(COLS).fill(0);

    for (let r = 0; r < ROWS; r++) {
        let isLineComplete = true;
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 0) {
                isLineComplete = false;
            } else {
                if (columnHeights[c] === 0) {
                    columnHeights[c] = ROWS - r;
                }
            }
        }
        if (isLineComplete) {
            completedLines++;
        }
    }

    for (let c = 0; c < COLS; c++) {
        aggregateHeight += columnHeights[c];
        let hasBlock = false;
        for (let r = ROWS - columnHeights[c]; r < ROWS; r++) {
            if (board[r][c] !== 0) {
                hasBlock = true;
            } else if (hasBlock) {
                holes++;
            }
        }
    }
    
    for (let c = 0; c < COLS - 1; c++) {
        bumpiness += Math.abs(columnHeights[c] - columnHeights[c+1]);
    }
    
    // Heuristic weights - these determine AI "skill"
    const heightWeight = -0.51;
    const linesWeight = 0.76;
    const holesWeight = -0.35;
    const bumpinessWeight = -0.18;

    return (aggregateHeight * heightWeight) +
           (completedLines * linesWeight) +
           (holes * holesWeight) +
           (bumpiness * bumpinessWeight);
}

// GAME LOOP
let lastTime = 0;
function update(time = 0) {
    if (isGameOver) return;
    
    if (!isAiActive) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            pieceDrop();
        }
    }
    draw();
    animationId = requestAnimationFrame(update);
}

// Controls
document.addEventListener('keydown', event => {
    if (isAiActive || isGameOver) return;

    if (event.key === 'ArrowLeft') {
        piece.x--;
        if (collide(board, piece)) piece.x++;
    } else if (event.key === 'ArrowRight') {
        piece.x++;
        if (collide(board, piece)) piece.x--;
    } else if (event.key === 'ArrowDown') {
        pieceDrop();
    } else if (event.key === 'ArrowUp') {
        const rotated = rotate(piece.matrix);
        const posX = piece.x;
        let offset = 1;
        piece.matrix = rotated;
        while (collide(board, piece)) {
            piece.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > piece.matrix[0].length + 1) {
                piece.matrix = rotate(rotate(rotate(piece.matrix))); // rotate back
                piece.x = posX;
                return;
            }
        }
    } else if (event.code === 'Space') {
        hardDrop();
    }
});

aiToggleButton.addEventListener('click', () => {
    if (isGameOver) return;
    isAiActive = !isAiActive;
    aiToggleButton.textContent = isAiActive ? 'AI is ON' : 'Player Mode';
    aiToggleButton.classList.toggle('player-mode', !isAiActive);
    updateStatusUI();
    if (isAiActive) {
        setTimeout(aiMove, AI_DELAY);
    }
});

// Start game
function init() {
    isGameOver = false;
    board = createBoard();
    score = 0;
    scoreElement.innerText = score;
    piece = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
    nextPiece = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
    updateStatusUI();
    
    if (isAiActive) {
        setTimeout(aiMove, AI_DELAY);
    }
    
    lastTime = 0;
    update();
}

// Initial state (before clicking start)
board = createBoard();
draw();
updateStatusUI();