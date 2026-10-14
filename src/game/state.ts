import type { Board, Difficulty } from "../core/types.ts";
import { deepCopy } from "../core/board.ts";

export type GameStatus = "playing" | "won" | "lost";

/** The game in progress. Only the controller changes it. */
export interface GameState {
    puzzle: Board;      // the board as the player has filled it so far
    solution: Board;
    difficulty: Difficulty;
    status: GameStatus;
    mistakes: number;
    timer: number;      // seconds played
}

export function createGameState(puzzle: Board, solution: Board, difficulty: Difficulty): GameState {
    return {
        puzzle: deepCopy(puzzle),
        solution: deepCopy(solution),
        difficulty,
        status: "playing",
        mistakes: 0,
        timer: 0,
    };
}
