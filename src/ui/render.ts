import type { Board, Difficulty } from "../core/types.ts";
import { BOX, SIZE } from "../core/config.ts";
import { cellKey, type Completeness } from "../core/validation.ts";
import type { UIRefs } from "./refs.ts";

export const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const blockOf = (r: number, c: number) => Math.floor(r / BOX) * BOX + Math.floor(c / BOX);

export function createDomRenderer(refs: UIRefs) {
    return {
        /** Fresh game: givens become read-only, every mark from the last game is cleared, the board deals in. */
        renderBoard(board: Board): void {
            board.forEach((row, r) => row.forEach((v, c) => {
                const el = refs.cells[r][c];
                el.value = v ? String(v) : "";
                el.readOnly = v !== 0;
                el.disabled = false;
                el.tabIndex = v ? -1 : 0;
                el.className = "cell";
                el.removeAttribute("row-complete");
                el.removeAttribute("col-complete");
                el.style.setProperty("--deal-delay", `${(r + c) * 25}ms`);
                replay(el, "deal");
            }));
            refs.blocks.forEach(b => b.removeAttribute("block-complete"));
        },
        renderDifficulty(d: Difficulty): void {
            refs.difficultyButtons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.difficulty === d)));
        },
        renderMistakes(mistakes: number, max: number): void {
            refs.mistakesCount.textContent = String(mistakes);
            refs.mistakesMax.textContent = String(max);
        },
        renderTimer(seconds: number): void {
            refs.timer.textContent = formatTime(seconds);
        },
        /** Dims keypad digits that are already placed 9 times. */
        renderDigitCounts(board: Board): void {
            const counts = Array(SIZE + 1).fill(0);
            board.flat().forEach(v => counts[v]++);
            refs.keypadButtons.forEach((b, i) => b.classList.toggle("used-up", counts[i + 1] >= SIZE));
        },
        /** Tints the selected cell's row, column and block, and every cell holding the same digit. */
        highlight(board: Board, sel: { r: number; c: number } | null): void {
            const digit = sel ? board[sel.r][sel.c] : 0;
            refs.cells.forEach((row, r) => row.forEach((el, c) => {
                const peer = !!sel && (r === sel.r || c === sel.c || blockOf(r, c) === blockOf(sel.r, sel.c));
                el.classList.toggle("peer", peer);
                el.classList.toggle("same-digit", digit !== 0 && board[r][c] === digit);
            }));
        },
        setCell(r: number, c: number, value: number, opts: { hinted?: boolean } = {}): void {
            const el = refs.cells[r][c];
            el.value = value ? String(value) : "";
            if (opts.hinted) {
                el.readOnly = true;
                el.classList.add("hinted");
            }
            if (value) replay(el, "pop");
        },
        markConflicts(conflicts: Set<string>): void {
            refs.cells.forEach((row, r) => row.forEach((el, c) =>
                el.classList.toggle("conflict", conflicts.has(cellKey(r, c)))));
        },
        markCompleteness({ rows, cols, blocks }: Completeness): void {
            refs.cells.forEach((row, r) => row.forEach((el, c) => {
                el.toggleAttribute("row-complete", rows[r]);
                el.toggleAttribute("col-complete", cols[c]);
            }));
            refs.blocks.forEach((el, b) => el.toggleAttribute("block-complete", blocks[b]));
        },
        pulseRow(r: number): void {
            refs.cells[r].forEach(el => pulse(el, "row-complete"));
        },
        pulseCol(c: number): void {
            refs.cells.forEach(row => pulse(row[c], "col-complete"));
        },
        pulseBlock(b: number): void {
            replay(refs.blocks[b], "block-pulse");
        },
        shake(r: number, c: number): void {
            replay(refs.cells[r][c], "shake");
            replay(refs.mistakes, "flash");
        },
        /** Win wave: each cell bounces with a delay based on its distance from the top-left corner. */
        celebrate(): void {
            refs.cells.forEach((row, r) => row.forEach((el, c) => {
                el.style.setProperty("--wave-delay", `${(r + c) * 40}ms`);
                replay(el, "wave");
            }));
        },
        disableBoard(): void {
            // Blur first: disabling the focused cell (the keypad's CSS anchor) makes Chrome drop focus
            // mid-style-update, which crashes the tab ("Aw, Snap", SIGTRAP) in Chrome 152.
            const active = refs.table.ownerDocument.activeElement;
            if (active instanceof HTMLElement && refs.table.contains(active)) active.blur();
            refs.cells.flat().forEach(el => el.disabled = true);
        },
        showResult(title: string, text: string): void {
            refs.resultTitle.textContent = title;
            refs.resultText.textContent = text;
            refs.result.showModal();
        },
    };
}

// Restarts a one-shot CSS animation class; the reflow lets the same class replay back to back.
// Ignores animationend bubbling up from children (e.g. a cell popping inside a pulsing block).
function replay(el: HTMLElement, cls: string) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    const done = (e: AnimationEvent) => {
        if (e.target !== el) return;
        el.classList.remove(cls);
        el.removeEventListener("animationend", done);
    };
    el.addEventListener("animationend", done);
}

// Plays the CSS line-completion animation; classes are dropped when it ends so it can replay later.
function pulse(el: HTMLElement, cls: string) {
    el.classList.remove(cls, "animate");
    el.classList.add(cls, "animate");
    el.addEventListener("animationend", () => el.classList.remove(cls, "animate"), { once: true });
}
