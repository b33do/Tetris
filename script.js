// Get canvas and context
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const aiToggleButton = document.getElementById('aiToggle');

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
const COLORS = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877F5'];
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
let dropCounter = 0;
let dropInterval = 1000; // ms for player drop

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
        board.forEach(row => row.fill(8)); // Visual effect for game over
        setTimeout(init, 500); // Restart after a brief delay
        return;
    }
    
    if (isAiActive) {
        setTimeout(aiMove, AI_DELAY);
    }
}

function draw() {
    // Draw main board
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 }, context);
    if (piece) {
        drawMatrix(piece.matrix, { x: piece.x, y: piece.y }, context);
    }

    // Draw next piece
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const offsetX = (NEXT_BOX_SIZE - nextPiece.matrix[0].length) / 2;
        const offsetY = (NEXT_BOX_SIZE - nextPiece.matrix.length) / 2;
        drawMatrix(nextPiece.matrix, { x: offsetX, y: offsetY }, nextContext);
    }
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value] || '#777'; // Gray for game over effect
                ctx.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#222';
                ctx.strokeRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

// AI LOGIC
function aiMove() {
    if (!piece || !isAiActive) return;
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
    if (!isAiActive) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            pieceDrop();
        }
    }
    draw();
    requestAnimationFrame(update);
}

// Controls
document.addEventListener('keydown', event => {
    if (isAiActive) return;

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
    isAiActive = !isAiActive;
    aiToggleButton.textContent = isAiActive ? 'AI is ON' : 'Player Mode';
    aiToggleButton.classList.toggle('player-mode', !isAiActive);
    if (isAiActive) {
        setTimeout(aiMove, AI_DELAY);
    }
});

// Start game
function init() {
    board = createBoard();
    score = 0;
    scoreElement.innerText = score;
    piece = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
    nextPiece = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
    if (isAiActive) {
        setTimeout(aiMove, AI_DELAY);
    }
}

init();
update();