# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Vite dev server on :5173 serving index.html (home) and about.html
npm run build       # Produces dist/charlie-fixes.iife.js (drop-in) + .mjs (ESM) + .d.ts
npm run typecheck   # tsc --noEmit
npm run preview     # Preview production build
```

There is no test suite and no lint/format tooling configured — the only automated check is `tsc`. Verification is manual: load the dev server, press `S`, pick elements, save comments, then navigate to `/about.html` to confirm the queue persists in localStorage.

## Architecture

Charlie fixes is an **installable drop-in overlay** (not an application). The whole thing boots from one `<script>` tag and renders a floating toolbar into any host page. Three architectural constraints drive everything:

1. **Must not leak styles into the host page, and host CSS must not leak in.** Everything renders inside a Shadow DOM attached to `#charlie-fixes-root`. Styles are scoped via `:host` and injected as a single `<style>` element inside the shadow root (see `src/index.ts`). The CSS file is imported as a string with Vite's `?inline` query.

2. **Must work on any page, any framework.** Hence Preact (not React) for size, aliased so the JSX in `src/` reads like React. No runtime deps besides Preact. Everything compiles to a single self-contained IIFE bundle.

3. **Must survive full page navigation.** The overlay is not an SPA — each page navigation reloads the script. State persists via `localStorage` under the key `charlie-fixes:queue` (see `src/lib/storage.ts`). Pins re-resolve their target elements by re-running `document.querySelector(item.targetSelector)` on each tick — so a pin saved on `/` may not render on `/about.html` if the selector doesn't match there, but the queue entry itself always survives.

### Data flow

`CharlieApp` (`src/CharlieApp.tsx`) is the single stateful root. It owns:

- `mode: 'idle' | 'picking'` — whether the element picker is active
- `composerEl: Element | null` — the DOM element currently being commented on
- `items: FixItem[]` — the saved queue (persisted to localStorage on every change via effect)
- `queueOpen`, `copied` — UI flags

Child components are stateless views driven by these props:

- `SelectionLayer` — mouse tracking + hover ring during `picking` mode, emits `onPick(el)`
- `Composer` — anchored popover, emits `onSave(text)` which builds a `FixItem` from the element via `describeNode()`
- `QueuePanel` — list UI with edit/delete/clear/copy
- `PinsLayer` — renders outlines for the active composer target and numbered markers for every saved item whose selector resolves on the current page. Re-computes bounds on scroll/resize/timer tick.

### Element identity

Saved fixes don't store a DOM reference — that wouldn't survive navigation. Instead, `describeNode()` (`src/lib/describeNode.ts`) produces a tag + short CSS selector chain + inner text snippet + dimensions. The selector is what `PinsLayer` re-resolves against the current page; the text and tag go into the generated markdown prompt (`src/lib/promptGen.ts`) so the receiving agent can locate the element even if the selector doesn't match its own codebase.

`isCharlieEl()` is used everywhere to filter out elements inside `#charlie-fixes-root` — otherwise the picker would target Charlie's own UI. The `#charlie-fixes-root` id is a load-bearing contract; don't rename it without updating `isCharlieEl()`.

### Keyboard handling

Global shortcuts (`S`, `L`, `Esc`) attach to `window` in `CharlieApp` and `SelectionLayer`. Events bubble out of the shadow root, so this works. The handler guards against stealing keystrokes from the host page by early-returning when `event.target` is an `INPUT`, `TEXTAREA`, or `contenteditable` element.

### Entry point (`src/index.ts`)

Exposes two APIs:
- Auto-mount on `DOMContentLoaded` unless `window.__CHARLIE__.mount === 'manual'`
- `window.CharlieFixes.mount()` / `.unmount()` for manual control

Build config (`vite.config.ts`) uses `lib` mode with `inlineDynamicImports: true` so the IIFE bundle stays a single file suitable for a CDN `<script>` tag. If you add dynamic imports (e.g. for lazy-loading `html2canvas`), they will be inlined into the same bundle — load-deferral has to be done at runtime via a CDN script tag injection, not via `import()`.

## Repository layout

- `src/` — Preact + TypeScript source (the actual tool)
- `design/` — **reference only, do not edit.** Original HTML/CSS/JS prototype from Claude Design. The TSX components in `src/` are direct ports of the JSX there. When deferred features (html2canvas screenshots, crop region, React fiber detection, tweaks panel, prompt-format switcher, mascot mood system) are implemented, port from `design/components/*.jsx` and `design/styles/charlie.css`.
- `index.html` + `about.html` — dev entries at project root. These are a faux SaaS landing ("Relaybin") used to exercise the overlay. Two pages exist specifically to verify queue persistence across navigation.
- `demo/landing.css` — styles for the Relaybin demo pages. The `demo/` folder is just demo assets; it is not the dev root (project root is).
- `dist/` — build output, git-ignored.

## Conventions

- **JSX attributes use Preact style** (`class`, `onInput`, `stroke-width`) not React style (`className`, `onChange`, `strokeWidth`). The `jsxImportSource` in `tsconfig.json` is `preact`.
- **CSS is plain CSS with `:host` scoping**, imported via `import styles from './styles.css?inline'`. No CSS modules, no preprocessor. The `src/vite-env.d.ts` declares the `?inline` module type.
- **Icons are inline SVG** in `src/icons.tsx`, shared via the `Icon` export. Don't pull in an icon library.
- **localStorage keys are namespaced** with `charlie-fixes:` prefix.
- **Z-index** uses `2147483000` on the shadow host to stay above essentially all host-page chrome.

## Adding deferred features

Roadmap (from `README.md`): screenshots (html2canvas, lazy-loaded), crop region, React fiber component detection, tweaks panel (bar position, accent, selection style, prompt format), mascot mood transitions + reaction bubbles, prompt format switcher (XML/JSON/Prose).

All of these already exist in the prototype under `design/` — port them, don't rewrite from scratch. `design/components/CharlieApp.jsx` has the full state machine and `generatePrompt()` covers every format variant.
