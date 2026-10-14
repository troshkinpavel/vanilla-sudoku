import type { Difficulty, Digit } from "../core/types.ts";
import { generateSudoku } from "../core/level-generator.ts";
import {
    cellKey, computeCompleteness, computeConflicts, isComplete, type Completeness,
} from "../core/validation.ts";
import { createGameState, type GameState } from "./state.ts";
import type { UIRefs } from "../ui/refs.ts";
import { createDomRenderer, formatTime } from "../ui/render.ts";
import { initCellsEvents, type Selection } from "../ui/events.ts";
import { keypadInit } from "../ui/keypad.ts";

const MAX_MISTAKES = 3;
const WIN_DIALOG_DELAY = 1200; // ms, lets the win wave finish first
const LOSE_DIALOG_DELAY = 500;

/** Wires the UI once; `start` can then be called for every new game. */
export function createGame(refs: UIRefs) {
    const view = createDomRenderer(refs);
    let state: GameState;
    let completeness: Completeness;
    let fixed: boolean[][]; // givens and hinted cells: never editable
    let selected: Selection = null;
    let dirty = false;

    window.setInterval(() => {
        // The board's own document: in picture-in-picture mode that is the PiP window, not this tab.
        if (state.status !== "playing" || refs.table.ownerDocument.hidden) return;
        state.timer++;
        view.renderTimer(state.timer);
    }, 1000);

    function start(difficulty: Difficulty) {
        const { puzzle, solution } = generateSudoku({ difficulty });
        state = createGameState(puzzle, solution, difficulty);
        completeness = computeCompleteness(puzzle, new Set());
        fixed = puzzle.map(row => row.map(v => v !== 0));
        selected = null;
        dirty = false;

        view.renderBoard(puzzle);
        view.renderDifficulty(difficulty);
        view.renderMistakes(0, MAX_MISTAKES);
        view.renderTimer(0);
        view.renderDigitCounts(puzzle);
        view.markCompleteness(completeness);
    }

    function place(r: number, c: number, value: Digit, { hinted = false } = {}) {
        const board = state.puzzle;
        if (state.status !== "playing" || fixed[r][c] || board[r][c] === value) return;
        board[r][c] = value;
        if (hinted) fixed[r][c] = true;
        dirty = true;
        view.setCell(r, c, value, { hinted });

        const conflicts = computeConflicts(board);
        const next = computeCompleteness(board, conflicts);
        view.markConflicts(conflicts);
        view.markCompleteness(next);
        next.rows.forEach((done, i) => done && !completeness.rows[i] && view.pulseRow(i));
        next.cols.forEach((done, i) => done && !completeness.cols[i] && view.pulseCol(i));
        next.blocks.forEach((done, i) => done && !completeness.blocks[i] && view.pulseBlock(i));
        completeness = next;
        view.renderDigitCounts(board);
        view.highlight(board, selected);

        // Every entry that lands in a conflict costs a mistake (hints never do).
        if (!hinted && conflicts.has(cellKey(r, c))) {
            state.mistakes++;
            view.renderMistakes(state.mistakes, MAX_MISTAKES);
            view.shake(r, c);
            if (state.mistakes >= MAX_MISTAKES) return endGame(false);
        }
        if (isComplete(board) && conflicts.size === 0) endGame(true);
    }

    /** Fills the selected cell if it is empty or wrong, otherwise a random such cell. */
    function hint() {
        if (state.status !== "playing") return;
        const { puzzle: board, solution } = state;
        const needsHelp = (r: number, c: number) => !fixed[r][c] && board[r][c] !== solution[r][c];

        let target = selected && needsHelp(selected.r, selected.c) ? selected : null;
        if (!target) {
            const open = board.flatMap((row, r) => row.map((_, c) => ({ r, c }))).filter(p => needsHelp(p.r, p.c));
            target = open[Math.floor(Math.random() * open.length)] ?? null;
        }
        if (!target) return;
        place(target.r, target.c, solution[target.r][target.c], { hinted: true });
        refs.cells[target.r][target.c].focus();
    }

    function endGame(won: boolean) {
        state.status = won ? "won" : "lost";
        view.highlight(state.puzzle, null);
        view.disableBoard();
        if (won) view.celebrate();

        const { difficulty, timer, mistakes } = state;
        const level = difficulty[0].toUpperCase() + difficulty.slice(1);
        const text = won
            ? `${level} puzzle in ${formatTime(timer)} with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`
            : `${MAX_MISTAKES} mistakes on ${level}. Try another one?`;
        window.setTimeout(() => view.showResult(won ? "Solved!" : "Game over", text),
            won ? WIN_DIALOG_DELAY : LOSE_DIALOG_DELAY);
    }

    const canLeave = () => !dirty || state.status !== "playing"
        || (refs.table.ownerDocument.defaultView ?? window).confirm("Start a new game? Your current progress will be lost.");

    initCellsEvents(refs, {
        onInput: (r, c, value) => place(r, c, value),
        onSelect: sel => {
            selected = sel;
            view.highlight(state.puzzle, sel);
        },
    });
    keypadInit(refs);
    refs.difficultyButtons.forEach(b => b.addEventListener("click", () => {
        if (canLeave()) start(b.dataset.difficulty as Difficulty);
    }));
    refs.newGame.addEventListener("click", () => canLeave() && start(state.difficulty));
    refs.hint.addEventListener("mousedown", e => e.preventDefault()); // keep the selected cell focused
    refs.hint.addEventListener("click", hint);
    refs.result.addEventListener("close", () => refs.result.returnValue === "new" && start(state.difficulty));

    return { start };
}
