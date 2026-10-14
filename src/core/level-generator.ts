import { verifyUnique } from "./solver.ts";
import { DIFFICULTY_CLUES, pickTargetClues } from "./difficulty.ts";
import { SIZE } from "./config.ts";
import type { Board, Digit, GeneratedPuzzle, GenerateOptions } from "./types.ts";
import { countClues, deepCopy, emptyBoard, findEmpty, isSafe, range, shuffle } from "./board.ts";

function coordPairs(symmetry: "none" | "rotate180"): [number, number][][] {
    const pairs: [number, number][][] = [];
    const seen = new Set<string>();
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const key = `${r},${c}`;
            if (seen.has(key)) continue;
            if (symmetry === "rotate180") {
                const r2 = SIZE - 1 - r;
                const c2 = SIZE - 1 - c;
                const key2 = `${r2},${c2}`;
                seen.add(key);
                seen.add(key2);
                if (r === r2 && c === c2) {
                    pairs.push([[r, c]]);
                } else {
                    pairs.push([[r, c], [r2, c2]]);
                }
            } else {
                seen.add(key);
                pairs.push([[r, c]]);
            }
        }
    }
    return pairs;
}

function generateFullGrid(rng: () => number): Board {
    const grid = emptyBoard();
    const digits = range(SIZE).map(n => n + 1);

    function dfs(): boolean {
        const pos = findEmpty(grid);
        if (!pos) return true;
        const [r, c] = pos;

        // Randomized order for variety
        for (const n of shuffle(digits, rng)) {
            if (isSafe(grid, r, c, n)) {
                grid[r][c] = n as Digit;
                if (dfs()) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }

    dfs();
    return grid;
}

function carvePuzzle(solution: Board, opts: Required<GenerateOptions>): Board {
    const puzzle = deepCopy(solution);

    // Randomize removal order of coordinate groups (single or symmetric pairs)
    const groups = shuffle(coordPairs(opts.symmetry), opts.rng);

    const targetClues = pickTargetClues(opts.difficulty, opts.rng);

    let attempts = 0;

    for (const group of groups) {
        if (countClues(puzzle) <= targetClues) break;
        if (attempts >= opts.maxRemovalAttempts) break;

        // Tentatively remove group
        const removed: Array<{ r: number; c: number; v: number }> = [];
        for (const [r, c] of group) {
            removed.push({ r, c, v: puzzle[r][c] });
            puzzle[r][c] = 0;
        }

        // Check uniqueness quickly
        const solCount = verifyUnique(puzzle, 2);
        if (solCount !== 1) {
            // revert
            for (const { r, c, v } of removed) puzzle[r][c] = v as Digit;
        }

        attempts++;
    }

    // If still above target, continue trying random singles until cap
    while (countClues(puzzle) > targetClues && attempts < opts.maxRemovalAttempts) {
        const r = Math.floor(opts.rng() * SIZE);
        const c = Math.floor(opts.rng() * SIZE);
        if (puzzle[r][c] === 0) {
            attempts++;
            continue;
        }
        const v = puzzle[r][c];
        puzzle[r][c] = 0;
        const solCount = verifyUnique(puzzle, 2);
        if (solCount !== 1) puzzle[r][c] = v;
        attempts++;
    }

    // Ensure we don't go below minimum clues by accident (rare, but safe-guard)
    const minClues = DIFFICULTY_CLUES[opts.difficulty].min;
    while (countClues(puzzle) < minClues) {
        // restore a random empty with the solution value
        const empties: [number, number][] = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) if (puzzle[r][c] === 0) empties.push([r, c]);
        }
        if (empties.length === 0) break;
        const [r, c] = empties[Math.floor(opts.rng() * empties.length)];
        puzzle[r][c] = solution[r][c];
    }

    return puzzle;
}

export function generateSudoku(options: GenerateOptions = {}): GeneratedPuzzle {
    const opts: Required<GenerateOptions> = {
        difficulty: options.difficulty ?? "medium",
        symmetry: options.symmetry ?? "rotate180",
        rng: options.rng ?? Math.random,
        maxRemovalAttempts: options.maxRemovalAttempts ?? 10_000,
    };

    // Step 1: build a full valid grid
    const solution = generateFullGrid(opts.rng);

    // Step 2: carve holes according to difficulty targets, keeping uniqueness
    const puzzle = carvePuzzle(solution, opts);

    // Step 3: Final guarantee that the puzzle has a unique solution
    const unique = verifyUnique(puzzle, 2) === 1;
    if (!unique) {
        // Fallback: if uniqueness somehow failed, regenerate once recursively.
        // (Loop is bounded by removal attempts; in practice this rarely triggers.)
        return generateSudoku(options);
    }

    return {
        puzzle,
        solution,
        difficulty: opts.difficulty,
        clues: countClues(puzzle),
    };
}