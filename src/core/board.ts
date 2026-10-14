import type { Board } from "./types.ts";
import { BOX, SIZE } from "./config.ts";

export const range = (n: number) => [...Array(n).keys()];

export function deepCopy(board: Board): Board {
    return board.map(row => row.slice());
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function isSafe(board: Board, r: number, c: number, n: number): boolean {
    for (let i = 0; i < SIZE; i++) {
        if (board[r][i] === n || board[i][c] === n) return false;
    }
    const br = Math.floor(r / BOX) * BOX;
    const bc = Math.floor(c / BOX) * BOX;
    for (let i = 0; i < BOX; i++) {
        for (let j = 0; j < BOX; j++) {
            if (board[br + i][bc + j] === n) return false;
        }
    }
    return true;
}

export function findEmpty(board: Board): [number, number] | null {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) return [r, c];
        }
    }
    return null;
}

export function countClues(board: Board): number {
    let cnt = 0;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) if (board[r][c] !== 0) cnt++;
    }
    return cnt;
}

export function emptyBoard(): Board {
    return range(SIZE).map(() => Array(SIZE).fill(0));
}