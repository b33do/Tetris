# Tetris
A retro-style Tetris game built in JavaScript, featuring a powerful heuristic AI that analyzes every possible move to clear lines and survive.

AI Tetris in JavaScript 🤖
A classic implementation of Tetris built with pure HTML, CSS, and JavaScript. This project features a sophisticated AI that can be toggled on and off, allowing you to either play the game yourself or watch the AI strive for the perfect game.

✨ Features
Heuristic AI Player: A powerful AI that calculates the optimal placement for each piece based on the state of the board.

Manual Player Mode: Take control and play a classic game of Tetris yourself.

Next Piece Preview: A dedicated window shows you which Tetromino is coming up next, allowing for better planning.

Live Score Tracking: Your score updates in real-time as you clear lines.

Retro Terminal Aesthetics: A clean, glowing UI inspired by classic computer terminals.

🧠 How the AI Works
The AI is the core of this project. It doesn't follow simple rules; it uses a heuristic scoring algorithm to evaluate every possible move for the current piece. For each potential placement (all rotations and horizontal positions), it simulates the move and gives the resulting board a score based on four key metrics:

Aggregate Height: The total height of all columns. The AI tries to keep this as low as possible.

Completed Lines: The number of lines that would be cleared. The AI prioritizes moves that clear lines.

Holes: The number of empty cells that have filled cells above them. The AI works hard to avoid creating holes.

Bumpiness: The variation in height between adjacent columns. The AI aims to keep the top surface of the stack as flat as possible.

The AI then executes the move with the highest calculated score, instantly dropping the piece into the most strategic position.

🚀 How to Run
No installation is needed! This project runs directly in the browser.

Clone this repository to your computer.

Open the index.html file in your web browser.

🎮 Controls (Player Mode)
Left/Right Arrow: Move the piece horizontally.

Up Arrow: Rotate the piece.

Down Arrow: Soft drop the piece (move it down faster).

Space Bar: Hard drop the piece (instantly place it at the bottom).
