import { range } from "../core/board.ts";
import { BOX, SIZE } from "../core/config.ts";

export interface UIRefs {
    app: HTMLElement;             // everything that moves into picture-in-picture
    table: HTMLElement;
    cells: HTMLInputElement[][];  // [row][col], 0-based
    blocks: HTMLElement[];        // index = band row * 3 + band column, matching the validation units
    keypadButtons: HTMLButtonElement[]; // index = digit - 1
    difficultyButtons: HTMLButtonElement[];
    timer: HTMLElement;
    mistakes: HTMLElement;
    mistakesCount: HTMLElement;
    mistakesMax: HTMLElement;
    keypad: HTMLElement;
    newGame: HTMLButtonElement;
    hint: HTMLButtonElement;
    result: HTMLDialogElement;
    resultTitle: HTMLElement;
    resultText: HTMLElement;
    pip: HTMLButtonElement;
    pipLabel: HTMLElement;
    pipPlaceholder: HTMLElement;
    pipReturn: HTMLButtonElement;
    settings: HTMLElement;
}

function need<T extends Element>(scope: ParentNode, selector: string): T {
    const el = scope.querySelector<T>(selector);
    if (!el) throw new Error(`Sudoku markup is missing "${selector}"`);
    return el;
}

export function initUIRefs(root: ParentNode = document): UIRefs {
    const sudoku = need<HTMLElement>(root, "#sudoku");
    return {
        app: need(root, "#app"),
        table: need(sudoku, ".table"),
        cells: range(SIZE).map(r => range(SIZE).map(c =>
            need<HTMLInputElement>(sudoku, `input.cell[data-row="${r + 1}"][data-column="${c + 1}"]`))),
        blocks: range(SIZE).map(b =>
            need<HTMLElement>(sudoku, `.block_${Math.floor(b / BOX) + 1}-${(b % BOX) + 1}`)),
        keypadButtons: range(SIZE).map(i => need<HTMLButtonElement>(sudoku, `.keypad button[data-value="${i + 1}"]`)),
        difficultyButtons: [...sudoku.querySelectorAll<HTMLButtonElement>("button[data-difficulty]")],
        timer: need(sudoku, "#timer"),
        mistakes: need(sudoku, ".mistakes"),
        mistakesCount: need(sudoku, "#mistakes-count"),
        mistakesMax: need(sudoku, "#mistakes-max"),
        keypad: need(sudoku, ".keypad"),
        newGame: need(sudoku, "#new-game"),
        hint: need(sudoku, "#hint"),
        result: need(root, "#result"),
        resultTitle: need(root, "#result-title"),
        resultText: need(root, "#result-text"),
        pip: need(sudoku, "#pip"),
        pipLabel: need(sudoku, "#pip-label"),
        pipPlaceholder: need(root, "#pip-placeholder"),
        pipReturn: need(root, "#pip-return"),
        settings: need(root, "#settings"),
    };
}
