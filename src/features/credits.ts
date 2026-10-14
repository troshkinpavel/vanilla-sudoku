import "../styles/features/credits.css";
import type { UIRefs } from "../ui/refs.ts";

const AUTHOR = { text: "Made by @troshkin_pavel", url: "https://x.com/troshkin_pavel" };
const SOURCE = { text: "Source on GitHub", url: "https://github.com/troshkinpavel/vanilla-sudoku" };

/** Author and source links under the game. */
export function initCredits(refs: UIRefs) {
    const credits = document.createElement("p");
    credits.className = "credits";
    credits.append(link(AUTHOR), " · ", link(SOURCE));
    refs.sudoku.append(credits);
}

function link({ text, url }: { text: string; url: string }) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = `${text} ↗`;
    return a;
}
