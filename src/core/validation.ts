import type { Board } from "./types.ts";
import { BOX, SIZE } from "./config.ts";
import { range } from "./board.ts";

type Cell = readonly [number, number];

export const cellKey = (r: number, c: number) => `${r},${c}`;

// The 27 units, each a list of 9 [row, col] cells. Block b covers rows/cols of box (b / 3, b % 3).
const ROWS: Cell[][] = range(SIZE).map(r => range(SIZE).map(c => [r, c] as const));
const COLS: Cell[][] = range(SIZE).map(c => range(SIZE).map(r => [r, c] as const));
const BLOCKS: Cell[][] = range(SIZE).map(b => range(SIZE).map(i =>
    [Math.floor(b / BOX) * BOX + Math.floor(i / BOX), (b % BOX) * BOX + (i % BOX)] as const));

/** Keys (`cellKey`) of every filled cell whose digit repeats in its row, column or block. */
export function computeConflicts(board: Board): Set<string> {
    const conflicts = new Set<string>();
    for (const unit of [...ROWS, ...COLS, ...BLOCKS]) {
        const byDigit = new Map<number, string[]>();
        for (const [r, c] of unit) {
            const v = board[r][c];
            if (v) byDigit.set(v, [...(byDigit.get(v) ?? []), cellKey(r, c)]);
        }
        for (const keys of byDigit.values()) {
            if (keys.length > 1) keys.forEach(k => conflicts.add(k));
        }
    }
    return conflicts;
}

/** Are all cells filled? */
export function isComplete(board: Board): boolean {
    return board.every(row => row.every(v => v !== 0));
}

export interface Completeness { rows: boolean[]; cols: boolean[]; blocks: boolean[]; }

/** A unit is complete when its 9 cells hold 9 distinct digits and none of them is in conflict. */
export function computeCompleteness(board: Board, conflicts: Set<string>): Completeness {
    const done = (unit: Cell[]) =>
        unit.every(([r, c]) => board[r][c] !== 0 && !conflicts.has(cellKey(r, c)))
        && new Set(unit.map(([r, c]) => board[r][c])).size === SIZE;
    return { rows: ROWS.map(done), cols: COLS.map(done), blocks: BLOCKS.map(done) };
}
