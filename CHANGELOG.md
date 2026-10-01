# RACINGBROS TOOLKIT HUB — changelog

## 2.0.4 — 2026-10-01

- **Colour schemes**: CARBON, CHECKERED, NEON GRID and MONO INK removed; new high-contrast **GRAPHITE** (dark, RACING red accent) and **PAPER** (light) — every text level ≥ 4.5:1. The scheme now sets dark/light, so the DARK/LIGHT switch is gone. Browsers set to a removed scheme fall back to RACING RED / PIT WHITE.
- **Custom colours**: all 11 hub colours are editable (added SURFACE 2, HOVER, BORDER STRONG, TEXT MUTE · HINTS, TEXT ON ACCENT) and follow into every tool.
- **Command palette**: one command per colour scheme; "light" / "dark" find only matching schemes.
- **One hamburger**: every tool's menu button is drawn like the hub's (kit-owned style). Tool copyright lines removed (PE menu, DISTRIBUTOR — TAIWAN footer); the credit lives only in the hub settings, laid out in two aligned rows.
- **READER**: the drop page shows for 5 s, then fades into the template book unless you click, type, drag or scroll; opening a file cancels it.
- **BIG**: dark grey desk behind the pages.
- **DISTRIBUTOR — GLOBAL / TAIWAN**: map thumbnail stays on a dark tray in light schemes (white land was invisible).

## 2.0.3 — 2026-10-01

- **Command palette** (Ctrl+K / ⌘K, or SEARCH in the header — also works while a tool has focus): jump to any tool, find a file in every LIBRARY folder and open it (Shift+Enter shows it in the LIBRARY), run hub commands — SAVE / SAVE COPY / REOPEN for the open file, light/dark theme, add files, exports-to-library, trash, connect folder, settings.
- **LIBRARY power tools**: Shift/Ctrl-click and Ctrl+A multi-select with a selection bar; drag files onto a folder or the path crumbs to move them; MOVE TO… folder picker; multi-download.
- **Trash**: delete now moves to `LIBRARY/.trash` (original location kept in `.trash/index.json`); TRASH button with count, restore, delete forever, empty trash. Recent, starred and open-file links follow moved files.
- **Open files survive reload**: a tool's LIBRARY file link is remembered; after a reload the bar shows *LINKED FROM LAST SESSION* and REOPEN loads it again.

## 2.0.2 — 2026-10-01

- **Open-file bar**: a tool opened from the LIBRARY shows the file (tab badge + path bar) with **SAVE** (write back over the file), **SAVE COPY** (new file beside it), **SHOW** and detach. Save support per tool lives in `glue/<TOOL>.js` (DIST TW/GLOBAL csv, RDPM html, PUBSYS csv/pack, MANUAL zip, POST svg/png, PE photo/video).
- **Recent + starred**: last 12 opened files and starred files, on the LIBRARY page and the MENU page; star from row, grid, menu or details.
- **Details pane + previews**: preview (image, SVG, CSV table, ZIP contents, HTML title, text), type, size, dimensions, tool, last opened; CSV and ZIP previews on grid cards.
- **Offline-safe**: PUBSYS embeds JSZip 3.10.1 and html2canvas 1.4.1; Latin webfonts (Barlow, Barlow Condensed, Montserrat, Roboto Condensed, Roboto Mono, Oswald, Inter, Saira Condensed) embedded per tool from `kit/fonts`; PUBSYS SVG→PNG embeds Montserrat. Chinese text uses the system font (Microsoft JhengHei) offline. Exported web pages (embeds, menus, HTML exports) still link Google Fonts.
- **PVP VIEWER**: on-screen plot follows the theme (dark plot, lifted run colours in dark); PNG/SVG/HTML exports stay on white.
- **PE**: compact desktop layout (mouse + ≥900 px); phone layout unchanged.
- **DISTRIBUTORS_TAIWAN**: updated from HAN's file (ALL overview, product series rows, regional list).

## 2.0.1 — 2026-10-01
First HUB 2.0 release.

- **LIBRARY tab** (next to MENU): a folder on disk, chosen once. Drag files or folders of any format in; double-click opens a file in the matching tool (CSV / ZIP / HTML routed by content), right-click → Open with…, built-in text editor and quick view, tool exports saved back beside the opened file.
- **One design system** for all tools: `kit/hub2-kit.css` tokens + per-tool `skins/`, dark and light following the hub theme; tool output (pages, maps, tables, posts, plots) keeps its print palette.
- **Bridge** (`kit/hub2-bridge.js`) in every tool: theme sync, open-file, export capture.
- Fixes: DISTRIBUTORS_GLOBAL no longer shares settings with TAIWAN (`gtw-*` namespace, one-time migration); PE survives blocked or corrupt storage; page titles (GLOBAL, READER, BIG); hub dev-panel shadow leak.
- Tooling: `tools/sync-kit.js` (kit, skins, version stamp from `VERSION`), `tools/validate.js` (jsdom).
