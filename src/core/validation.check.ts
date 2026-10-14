// Self-check for the pure board logic. Run: npm run check
import { generateSudoku } from "./generator.ts";
import { solveSudoku } from "./solver.ts";
import { cellKey, computeCompleteness, computeConflicts, isComplete } from "./validation.ts";

const { puzzle, solution } = generateSudoku({ difficulty: "easy" });
const assert = (ok: boolean, msg: string) => { if (!ok) throw new Error(msg); };

assert(JSON.stringify(solveSudoku(puzzle)) === JSON.stringify(solution), "solver finds the generated solution");
assert(computeConflicts(puzzle).size === 0 && !isComplete(puzzle), "fresh puzzle: no conflicts, not complete");

const full = computeCompleteness(solution, computeConflicts(solution));
assert(isComplete(solution) && [...full.rows, ...full.cols, ...full.blocks].every(Boolean), "solution: every unit complete");

// Duplicate the top-left digit into (0,1): both cells conflict, row 0 and block 0 stop being complete.
const broken = solution.map(row => row.slice());
broken[0][1] = broken[0][0];
const conflicts = computeConflicts(broken);
assert(conflicts.has(cellKey(0, 0)) && conflicts.has(cellKey(0, 1)), "duplicate digit marks both cells");
const part = computeCompleteness(broken, conflicts);
// Row 0 and the row holding the other copy in column 1 break; the other 7 rows stay complete.
assert(!part.rows[0] && !part.blocks[0] && part.rows.filter(Boolean).length === 7, "only touched units lose completeness");

console.log("validation self-check passed");
