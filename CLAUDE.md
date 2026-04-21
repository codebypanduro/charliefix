# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 5173, auto-opens. Uses `index.html` / `demo-react.html` / `about.html` as dev entry points.
- `npm run build` — two-pass build: (1) main IIFE + ESM bundle from `src/index.ts`, (2) `VITE_BUILD_TARGET=wrappers` multi-entry ESM build for `src/react.tsx` and `src/vue.ts`, then `tsc --emitDeclarationOnly` for `.d.ts` output. Both passes write to `dist/`; the second must not empty it (`emptyOutDir: false`).
- `npm run typecheck` — `tsc --noEmit`. There is no test runner and no linter configured.
- `npm run preview` — serves the built bundle.

## Architecture

This is a **Preact** overlay distributed as three entry points from a single source tree:

- `src/index.ts` — the drop-in IIFE/ESM bundle. Self-mounts on `DOMContentLoaded` into `document.body` inside a **Shadow DOM** (`src/index.ts:32`) with inlined styles (`styles.css?inline`), exposes `window.CharlieFixes = { mount, unmount }`, and reads config from `window.__CHARLIE__`. This is what `unpkg.com/charlie-fixes` serves.
- `src/react.tsx` — a thin React wrapper that dynamically `import()`s `charlie-fixes` in `useEffect` and calls `unmount()` on cleanup. Ships with `'use client'` banner (added in `vite.config.ts` rollup output).
- `src/vue.ts` — equivalent Vue 3 wrapper.

The React/Vue wrappers externalize `react`, `vue`, and `charlie-fixes` itself — they are glue, not duplicate bundles. The main bundle uses `inlineDynamicImports: true` so consumers get a single file.

**Runtime stack inside the overlay** (`src/CharlieApp.tsx`): Preact + `preact/hooks`, rendered into a Shadow DOM so the host page's CSS cannot leak in and vice versa. `tsconfig.json` sets `jsxImportSource: "preact"` — **do not import from `react`** inside `src/` (except `src/react.tsx`, which is the external wrapper and is externalized at build time).

**State & persistence — two stores, don't conflate them:**
- `localStorage` key `charlie-fixes:queue` — the fix queue metadata (`src/lib/storage.ts`).
- IndexedDB `charlie-fixes` → `images` — screenshot blobs keyed by `imageId` (`src/lib/imageStore.ts`). Deleting a fix must also `deleteImage(imageId)` — see the pattern in `CharlieApp.tsx:122` and `CharlieApp.tsx:141`.

**Key modules:**
- `src/lib/describeNode.ts` — turns a picked DOM element into selector + component chain + source hints for the prompt.
- `src/lib/promptGen.ts` — assembles the final markdown. Groups by `route` when multiple pages are captured; image references use `charlie-fix-N.png` paths that match what the paste panel downloads.
- `src/lib/captureImage.ts` — `html2canvas` wrapper for region/full-viewport capture. `html2canvas` is only pulled in when capture actually runs.
- `src/components/` — the UI layers: `SelectionLayer` (element pick), `CropLayer` (drag-to-crop), `Composer` (comment input), `QueuePanel` (fix list), `ShotPastePanel` (post-handoff image copy flow), `PinsLayer` (in-page pin markers), `Charlie` (mascot).

## Conventions & gotchas

- **Shadow DOM**: all UI lives inside `#charlie-fixes-root`'s shadow root. The accent color is passed through a `--c-accent` CSS custom property injected as a `<style>` inside the shadow root (`CharlieApp.tsx:159`). Don't add global styles expecting to reach the overlay.
- **Keyboard shortcuts** (`S`, `C`, `L`, `Esc`, `⏎`) are registered on `window` but ignored when the target is an `input`/`textarea`/contentEditable. If adding new shortcuts, follow the guard in `CharlieApp.tsx:38`.
- **Never ship to production.** The README's dev-only install snippets are the intended usage pattern; treat them as canonical.
- **Image lifecycle**: whenever you remove a `FixItem` with an `imageId`, call `deleteImage(imageId)`. Orphaned blobs accumulate in IndexedDB otherwise.
- **TypeScript strict** + `noUnusedLocals` + `noUnusedParameters` are on. `design/` and `demo/` are excluded from `tsc` — don't put source there.
