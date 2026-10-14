import type { Board, Digit } from "./types.ts";
import { deepCopy, findEmpty, isSafe } from "./board.ts";

export function solveSudoku(board: Board): Board | null {
    const grid = deepCopy(board);
    const solved = backtrackSolve(grid);
    return solved ? grid : null;
}

function backtrackSolve(board: Board): boolean {
    const pos = findEmpty(board);
    if (!pos) return true; // solved
    const [r, c] = pos;

    for (let n = 1; n <= 9; n++) {
        if (isSafe(board, r, c, n)) {
            board[r][c] = n as Digit;
            if (backtrackSolve(board)) return true;
            board[r][c] = 0;
        }
    }
    return false;
}

export function verifyUnique(board: Board, cap = 2): number {
    const grid = deepCopy(board);
    let count = 0;

    function dfs(): void {
        if (count >= cap) return; // early cutoff
        const pos = findEmpty(grid);
        if (!pos) {
            count++;
            return;
        }
        const [r, c] = pos;

        for (let n = 1; n <= 9; n++) {
            if (isSafe(grid, r, c, n)) {
                grid[r][c] = n as Digit;
                dfs();
                grid[r][c] = 0;
                if (count >= cap) return;
            }
        }
    }

    dfs();
    return count;
}