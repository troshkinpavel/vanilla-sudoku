import type { UIRefs } from "./refs.ts";

// Chrome's Document Picture-in-Picture API (Chromium 116+); not in TypeScript's DOM lib yet.
declare global {
    interface Window {
        documentPictureInPicture?: {
            requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
            readonly window: Window | null;
        };
    }
}

/** Moves the live game (same nodes, same listeners, same state) into an always-on-top window and back. */
export function initPip(refs: UIRefs) {
    const api = window.documentPictureInPicture;
    if (!api) return; // the button stays hidden in browsers without the API
    refs.pip.hidden = false;

    refs.pipReturn.addEventListener("click", () => api.window?.close());
    refs.pip.addEventListener("click", async () => {
        if (api.window) return api.window.close();

        let pipWindow: Window;
        try {
            pipWindow = await api.requestWindow({ width: 420, height: 470 }); // fits the compact layout
        } catch (err) {
            // e.g. embedded browsers that expose the API but can't open the window: drop the dead button.
            console.warn("Picture-in-picture is unavailable here:", err);
            refs.pip.hidden = true;
            return;
        }
        copyStyles(pipWindow.document);
        Object.assign(pipWindow.document.documentElement.dataset, document.documentElement.dataset); // mode + theme
        pipWindow.document.title = document.title;
        pipWindow.document.body.append(refs.app);
        refs.pipLabel.textContent = "Pop in";
        refs.pipPlaceholder.hidden = false;

        // Fires when the user closes the PiP window or we close it: put the game back where it was.
        pipWindow.addEventListener("pagehide", () => {
            refs.pipPlaceholder.before(refs.app);
            refs.pipPlaceholder.hidden = true;
            refs.pipLabel.textContent = "Pop out";
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
