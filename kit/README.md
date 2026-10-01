# HUB 2.0 kit

Every tool stays a single self-contained HTML file. The shared parts are written once here and copied into each file by `tools/sync-kit.js`.

| Source | Goes into | Purpose |
|---|---|---|
| `kit/hub2-kit.css` | every tool, `<style id="hub2-kit">` | design tokens (`--h2-*`), dark default + `[data-h2-theme="light"]`, scrollbars, focus, range sliders, `.h2-btn` / `.h2-field` |
| `kit/hub2-bridge.js` | every tool, `<script id="hub2-bridge">` | follows the hub theme, opens LIBRARY files through the tool's own file input, sends exports back to the LIBRARY |
| `skins/<TOOL>.css` | that tool, `<style id="hub2-skin">` before `</head>` | maps the tool's own variables and chrome onto the tokens; output canvases keep their print palette |
| `glue/<TOOL>.js` | that tool, `<script id="hub2-glue">` before `</body>` | `HUB2_SAVES` / `HUB2_SAVE(ext)` for the hub's SAVE / SAVE COPY |
| `kit/fonts.json` + `kit/fonts/` | listed tools, `<style id="hub2-fonts">` | offline Latin webfonts; `vendor` entries inline `kit/vendor/*.js` in place of CDN tags |
| `VERSION` | hub title, header, dev panel, bridge | release stamp |
| `kit/hub-library.js` | `index.html` between `/*HUB2:LIBRARY:BEGIN*/ … END*/` | tool registry, LIBRARY tab, hub side of the bridge |

## Workflow

1. Edit the source file above (never the copy inside a tool).
2. `node tools/sync-kit.js`
3. `node tools/validate.js` (needs `npm i jsdom` once)
4. Commit.

## Tokens

`--h2-bg  --h2-surface  --h2-surface-2  --h2-surface-3  --h2-line  --h2-line-strong`
`--h2-fg  --h2-fg-dim  --h2-fg-mute  --h2-accent  --h2-accent-hover  --h2-accent-fg  --h2-accent-soft`
`--h2-ok  --h2-warn  --h2-info  --h2-font  --h2-mono  --h2-mark`

Section labels use the red marker: `background:var(--h2-mark) 0 50%/3px 11px no-repeat; padding-left:12px`.

## Tool hamburgers

`kit/hub2-kit.css` draws every tool's menu button like the hub's (`.menu-btn`, `.hamburger-inline`, `#menuBtn`, `.trm-burger-btn`, `.trm-hamburger`). Add a new tool's button selector there instead of styling it in a skin.

## Command palette

Ctrl+K (⌘K) in the hub or inside any tool (the bridge forwards it as `hub2:palette`). Source: `Palette` at the end of `kit/hub-library.js`; files come from `Library.index()` (all folders, dot-folders skipped, cached 15 s).

## Opening files from the LIBRARY

The bridge picks the tool's `<input type="file">` whose `accept` matches the file. To route a format to a specific input, add `data-hub2-open="csv svg"` to it; `data-hub2-skip` keeps an input out of automatic routing. A tool can also define `window.HUB2_OPEN = file => {…}` to take over.

## Adding a new tool

Put the HTML next to `index.html`, add it to `DEFAULT_TOOLS` in `index.html` and to `TOOL_INFO` / `OPENS` in `kit/hub-library.js`, optionally write `skins/<TOOL>.css`, then sync.
