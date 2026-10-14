import type { Difficulty } from "./types.ts";

interface DifficultyClueRange { min: number; max: number; }

export const DIFFICULTY_CLUES: Record<Difficulty, DifficultyClueRange> = {
    easy: { min: 36, max: 49 },
    medium: { min: 30, max: 35 },
    hard: { min: 24, max: 29 },
};

export function pickTargetClues(difficulty: Difficulty, rng: () => number = Math.random): number {
    const { min, max } = DIFFICULTY_CLUES[difficulty];
    return Math.floor(min + (max - min) * rng());
}
