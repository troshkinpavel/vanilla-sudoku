/// <reference types="vite/client" />

// Build flags, set per build variant in vite.config.ts. Code behind a false flag is left out of that build.
declare const __FEATURE_PIP__: boolean;
declare const __FEATURE_CREDITS__: boolean;
declare const __DEFAULT_THEME__: string;
