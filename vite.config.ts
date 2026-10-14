import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

// Three builds from the same source, picked with `vite build --mode <variant>`:
//   site    a normal website (default)                          dist/site/
//   bundle  one sudoku.js + one sudoku.css + index.html         dist/bundle/
//   pen     CodePen panels: index.html (body), style.css,       dist/pen/
//           script.js; readable, Brutal theme, credits, no PiP
type Variant = "site" | "bundle" | "pen";

const FEATURES: Record<Variant, { pip: boolean; credits: boolean; defaultTheme: string }> = {
    site: { pip: true, credits: false, defaultTheme: "classic" },
    bundle: { pip: true, credits: false, defaultTheme: "classic" },
    pen: { pip: false, credits: true, defaultTheme: "brutal" },
};

export default defineConfig(({ mode }) => {
    const variant: Variant = mode === "bundle" || mode === "pen" ? mode : "site";
    const features = FEATURES[variant];
    const single = variant !== "site";

    return {
        define: {
            __FEATURE_PIP__: JSON.stringify(features.pip),
            __FEATURE_CREDITS__: JSON.stringify(features.credits),
            __DEFAULT_THEME__: JSON.stringify(features.defaultTheme),
        },
        build: !single ? { outDir: "dist/site" } : {
            outDir: `dist/${variant}`,
            emptyOutDir: true,
            copyPublicDir: variant === "bundle",
            minify: variant === "bundle", // the pen stays readable
            cssMinify: variant === "bundle",
            lib: {
                entry: "src/main.ts",
                formats: ["iife"],
                name: "Sudoku",
                fileName: () => (variant === "pen" ? "script.js" : "sudoku.js"),
                cssFileName: variant === "pen" ? "style" : "sudoku",
            },
        },
        plugins: [dropDisabledFeatureStyles(features), ...(single ? [singleFilePage(variant)] : [])],
    };
});

/**
 * A feature's stylesheet (styles/features/<feature>.css, imported by its module) loads as empty when the
 * feature is off: the module's code is dropped from the build, but Vite would otherwise keep its CSS.
 */
function dropDisabledFeatureStyles(features: Record<string, unknown>): Plugin {
    return {
        name: "drop-disabled-feature-styles",
        enforce: "pre",
        load(id) {
            const feature = id.match(/styles\/features\/(\w+)\.css$/)?.[1];
            if (feature && features[feature] === false) return "";
        },
    };
}

/** Writes the page for the single-file variants from index.html: a full page for the bundle, the body for CodePen. */
function singleFilePage(variant: "bundle" | "pen"): Plugin {
    return {
        name: "single-file-page",
        apply: "build",
        enforce: "post", // after Vite has emitted the CSS file
        generateBundle(_, bundle) {
            const html = readFileSync("index.html", "utf8");
            const fonts = html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"/)?.[1];
            const headScript = html.match(/<script>\n([\s\S]*?)\n\s*<\/script>/)?.[1];
            const body = html.match(/<body>\n([\s\S]*?)\n<script type="module"/)?.[1];
            const js = Object.values(bundle).find(file => file.type === "chunk");
            const css = Object.values(bundle).find(file => file.type === "asset" && file.fileName.endsWith(".css"));
            const missing = Object.entries({ fonts, headScript, body, js, css }).filter(([, part]) => !part).map(([name]) => name);
            if (missing.length || js?.type !== "chunk" || css?.type !== "asset") {
                this.error(`index.html or the bundle is missing: ${missing.join(", ") || "JS chunk / CSS asset"}`);
            }

            if (variant === "pen") {
                // CodePen has one panel per language and supplies <head> itself: the fonts move into the CSS,
                // the head script to the top of the JS. Source-path comments from the bundler are dropped.
                js.code = `${dedent(headScript)}\n\n${js.code.replace(/^\/\/#(?:end)?region.*\n/gm, "")}`;
                css.source = `@import url("${fonts}");\n\n${String(css.source).replace(/\/\*\$vite\$:\d+\*\/\n?/g, "")}`;
                this.emitFile({ type: "asset", fileName: "index.html", source: `${body}\n` });
                return;
            }
            const page = html
                .replace('href="/favicon.svg"', 'href="favicon.svg"')
                .replace("</head>", '    <link rel="stylesheet" href="sudoku.css">\n</head>')
                .replace('<script type="module" src="/src/main.ts"></script>', '<script src="sudoku.js" defer></script>');
            this.emitFile({ type: "asset", fileName: "index.html", source: page });
        },
    };
}

function dedent(text: string) {
    const lines = text.split("\n");
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length));
    return lines.map(line => line.slice(indent)).join("\n");
}
