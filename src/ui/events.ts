import type { Digit } from "../core/types.ts";
import { SIZE } from "../core/config.ts";
import type { UIRefs } from "./refs.ts";

export type Selection = { r: number; c: number } | null;

const MOVES: Record<string, [number, number]> = {
    ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
};

export function initCellsEvents(refs: UIRefs, handlers: {
    onInput: (r: number, c: number, value: Digit) => void;
    onSelect: (sel: Selection) => void;
}) {
    refs.cells.forEach((row, r) => row.forEach((cell, c) => {
        // Soft keyboards and the keypad land here; keep only the newest digit 1–9.
        cell.addEventListener("input", () => {
            cell.value = cell.value.replace(/[^1-9]/g, "").slice(-1);
            handlers.onInput(r, c, Number(cell.value) as Digit);
        });
        cell.addEventListener("focus", () => handlers.onSelect({ r, c }));
        cell.addEventListener("keydown", e => {
            const move = MOVES[e.key];
            if (move) {
                e.preventDefault(); // also stops number inputs from stepping their value
                refs.cells[(r + move[0] + SIZE) % SIZE][(c + move[1] + SIZE) % SIZE].focus();
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey || e.key.length > 1 && e.key !== "Backspace" && e.key !== "Delete") return;
            e.preventDefault();
            if (cell.readOnly) return;
            const next = /^[1-9]$/.test(e.key) ? e.key : e.key === "Backspace" || e.key === "Delete" || e.key === "0" ? "" : null;
            if (next === null || next === cell.value) return;
            cell.value = next;
            cell.dispatchEvent(new Event("input"));
        });
    }));

    // Clear the highlight once focus leaves the grid.
    refs.table.addEventListener("focusout", e => {
        const to = e.relatedTarget;
        if (!(to instanceof HTMLInputElement && to.classList.contains("cell"))) handlers.onSelect(null);
    });
}
