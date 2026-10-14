import type { UIRefs } from "../ui/refs.ts";

const STORAGE_KEY = "sudoku-settings"; // also read by the inline script in the page head

/**
 * Mode (auto/light/dark) and theme live as data-mode / data-theme on <html>; the CSS does the rest.
 * The inline script in the page head restores them before first paint, so here we only sync the radios and save changes.
 */
export function initSettings(refs: UIRefs) {
    const root = document.documentElement;
    // Nothing saved yet: start in this build's default theme (Classic needs no attribute).
    if (!root.dataset.theme && __DEFAULT_THEME__ !== "classic") root.dataset.theme = __DEFAULT_THEME__;

    for (const name of ["mode", "theme"] as const) {
        const radios = [...refs.settings.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
        // Unknown or missing saved value: fall back to the first option (auto / classic).
        (radios.find(r => r.value === root.dataset[name]) ?? radios[0]).checked = true;
    }

    refs.settings.addEventListener("change", e => {
        const input = e.target as HTMLInputElement;
        // The game may be in the picture-in-picture window: theme both documents.
        for (const doc of new Set([document, refs.app.ownerDocument])) doc.documentElement.dataset[input.name] = input.value;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: root.dataset.mode, theme: root.dataset.theme }));
        } catch {
            // Storage blocked (private mode, disabled site data): the choice just won't persist.
        }
    });
}
