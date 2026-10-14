# Vanilla Sudoku

A Sudoku game with no frameworks: TypeScript, HTML and CSS, built with Vite.

Every puzzle is generated in the browser and always has exactly one solution.

## Features

- **Three levels:** Easy, Medium and Hard. Each new puzzle is generated, never loaded from a list.
- **Mistake checking:** a digit that repeats in its row, column or box turns red. Three mistakes end the game.
- **Hints:** put the correct digit in the selected cell, or in a random empty or wrong cell. Hints do not count as mistakes.
- **Timer:** pauses while the tab is hidden and stops when the game ends.
- **Highlights:** the selected cell's row, column and box, and every cell with the same digit.
- **Animations:** a finished row, column or box pulses, and a solved board plays a wave.
- **Six themes:** Classic, Pixel, Terminal, Cartoon, Brutal and Glass. Each has a light and a dark version.
- **Light, dark or auto mode:** auto follows the system setting. Your choice is saved in the browser.
- **Picture-in-picture:** in Chrome and Edge, **Pop out** keeps the game on top of other windows.
- **Keyboard, mouse and touch:** arrow keys move, 1–9 enter a digit, Backspace clears. A number pad also opens next to the selected cell.
- **Small screens:** the controls become an icon toolbar, and the board shrinks to fit.

## Getting started

You need [Node.js](https://nodejs.org/) 22.18 or newer.

```bash
npm install
npm run dev
```

Then open the address that Vite shows, usually http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with live reload. |
| `npm run build` | Checks the types and builds the site into `dist/`. |
| `npm run preview` | Serves the built site from `dist/`. |
| `npm run check` | Runs the self-check for the puzzle logic. |

## How it works

1. The generator fills an empty grid with random digits, using backtracking. The result is a complete, valid solution.
2. It then removes digits, in pairs that mirror each other through the centre. After each removal, a solver counts the solutions. If there is more than one, the digits go back.
3. It stops when the puzzle has the number of givens for the level:

   | Level | Givens |
   |---|---|
   | Easy | 36–48 |
   | Medium | 30–34 |
   | Hard | 24–28 |

## Project structure

```
src/
├── core/    Puzzle logic, no DOM: generator, solver, validation, board helpers
├── game/    Game state and the controller that connects the logic to the page
├── ui/      DOM code: rendering, input, number pad, settings, picture-in-picture
├── index.ts Entry point
└── style.css
```

The `core` code does not use the DOM, so it also runs in Node. The `npm run check` self-check uses this.

## Themes

Each theme is a set of CSS custom properties under `:root[data-theme="…"]` in `style.css`. Colours use `light-dark()`, so every theme has a light and a dark version. To add a theme:

1. Copy one of the theme blocks in `style.css` and give it a new name.
2. Add a radio button with the same name to the settings menu in `index.html`.

## Browser support

The game uses recent web features: `light-dark()`, CSS anchor positioning, the Popover API and the `<dialog>` element. It works best in a current version of Chrome or Edge. In browsers without anchor positioning, the number pad and the settings menu can show in a different place.

Picture-in-picture uses the Document Picture-in-Picture API, which only Chromium browsers have. In other browsers, the **Pop out** button does not show.
