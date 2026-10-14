import type { UIRefs } from "./refs.ts";

export function keypadInit(refs: UIRefs) {
    // Keep focus on the selected cell while a keypad button is pressed.
    refs.keypad.addEventListener("mousedown", e => e.preventDefault());

    refs.keypad.addEventListener("click", e => {
        const button = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-value]");
        const cell = refs.keypad.ownerDocument.activeElement; // the board may live in a PiP window
        if (!button || !(cell instanceof HTMLInputElement) || !cell.classList.contains("cell")) return;
        if (cell.readOnly || cell.disabled) return;
        cell.value = button.dataset.value ?? "";
        cell.dispatchEvent(new Event("input", { bubbles: true })); // reuse the normal input path
        cell.blur(); // closes the keypad
    });
}
