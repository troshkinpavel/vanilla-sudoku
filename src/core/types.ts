export type Digit = 0|1|2|3|4|5|6|7|8|9; // 0 = empty

export type Board = Digit[][]; // 0 represents empty

export type Difficulty = "easy" | "medium" | "hard";

export interface GenerateOptions {
    difficulty?: Difficulty;
    symmetry?: "none" | "rotate180"; // visual symmetry of given clues
    rng?: () => number; // optional RNG (0<=n<1). Defaults to Math.random
    // Hard cap to avoid long loops; if exceeded, generator returns the best attempt so far.
    maxRemovalAttempts?: number;
}

export interface GeneratedPuzzle {
    puzzle: Board;   // with 0s for blanks
    solution: Board; // full solved board
    difficulty: Difficulty;
    clues: number;   // number of given cells
}