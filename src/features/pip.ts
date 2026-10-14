import "../styles/features/pip.css";
import type { UIRefs } from "../ui/refs.ts";

// Chrome's Document Picture-in-Picture API (Chromium 116+); not in TypeScript's DOM lib yet.
declare global {
    interface Window {
        documentPictureInPicture?: {
            requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
            readonly window: Window | null;
        };
    }
}

const POP_OUT_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'
    + '<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="11" width="7" height="6" rx="1"/></svg>';

/** Moves the live game (same nodes, same listeners, same state) into an always-on-top window and back. */
export function initPip(refs: UIRefs) {
    const api = window.documentPictureInPicture;
    if (!api) return; // browsers without the API get no button at all

    const button = document.createElement("button");
    button.type = "button";
    button.className = "action";
    button.id = "pip";
    button.title = "Keep the game on top of other windows";
    button.innerHTML = `${POP_OUT_ICON}<span class="label">Pop out</span>`;
    const label = button.querySelector(".label")!;
    refs.hint.after(button);

    // Left in the page while the game is in the other window.
    const placeholder = document.createElement("div");
    placeholder.id = "pip-placeholder";
    placeholder.hidden = true;
    placeholder.innerHTML = '<p>Playing in a picture-in-picture window.</p><button type="button" class="action">Bring it back</button>';
    refs.app.after(placeholder);

    placeholder.querySelector("button")!.addEventListener("click", () => api.window?.close());
    button.addEventListener("click", async () => {
        if (api.window) return api.window.close();

        let pipWindow: Window;
        try {
            pipWindow = await api.requestWindow({ width: 420, height: 470 }); // fits the compact layout
        } catch (err) {
            // e.g. embedded browsers that expose the API but can't open the window: drop the dead button.
            console.warn("Picture-in-picture is unavailable here:", err);
            button.hidden = true;
            return;
        }
        copyStyles(pipWindow.document);
        Object.assign(pipWindow.document.documentElement.dataset, document.documentElement.dataset); // mode + theme
        pipWindow.document.title = document.title;
        pipWindow.document.body.append(refs.app);
        label.textContent = "Pop in";
        placeholder.hidden = false;

        // Fires when the user closes the PiP window or we close it: put the game back where it was.
        pipWindow.addEventListener("pagehide", () => {
            placeholder.before(refs.app);
            placeholder.hidden = true;
            label.textContent = "Pop out";
        });
    });
}

function copyStyles(target: Document) {
    for (const sheet of document.styleSheets) {
        try {
            const style = target.createElement("style");
            style.textContent = [...sheet.cssRules].map(rule => rule.cssText).join("\n");
            target.head.append(style);
        } catch {
            // Cross-origin sheets (Google Fonts) can't be read from script; link them instead.
            if (!sheet.href) continue;
            const link = target.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            target.head.append(link);
        }
    }
}
