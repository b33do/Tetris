# Tetris (with AI Player)

This is a browser-based Tetris game I built using plain **HTML, CSS, and JavaScript**.  
In addition to manual play, the game includes an optional AI player that evaluates the board and automatically places pieces.

The goal of this project was to understand game loops, grid-based logic, and simple decision-making algorithms — not to perfectly recreate competitive Tetris.

---

## Features

- **Playable Tetris**  
  Fully playable with keyboard controls.

- **Toggleable AI Mode**  
  You can switch between playing manually and letting the AI control the game.

- **Next Piece Preview**  
  Shows the upcoming tetromino to allow planning (for both player and AI).

- **Score Tracking**  
  Score updates as lines are cleared.

- **Simple Retro UI**  
  Styled with a terminal-inspired look using CSS.

---

## AI Overview

The AI is rule-based and heuristic-driven — it does **not** learn or adapt over time.

For each new piece, the AI:
1. Tries every possible rotation
2. Tries every valid horizontal position
3. Simulates dropping the piece
4. Scores the resulting board
5. Chooses the move with the best score

### Board Evaluation Metrics

Each simulated board state is scored using these factors:

- **Aggregate column height**  
  Lower total height is preferred.

- **Completed lines**  
  Clearing lines is strongly rewarded.

- **Holes**  
  Empty cells beneath filled cells are penalized.

- **Surface bumpiness**  
  Large height differences between adjacent columns are penalized.

These values are combined into a weighted score, and the highest-scoring move is executed.

---

## Controls (Manual Mode)

- **Left / Right Arrow** – Move piece
- **Up Arrow** – Rotate
- **Down Arrow** – Soft drop
- **Space** – Hard drop

---

## Running the Project

No build tools or dependencies are required.

1. Clone or download the repository
2. Open `index.html` in any modern browser
3. Play manually or enable AI mode

---

## Notes

This project is intentionally kept lightweight and framework-free to focus on:
- Game state management
- Grid-based collision logic
- Simple AI heuristics
- Clean separation between rendering, input, and logic
