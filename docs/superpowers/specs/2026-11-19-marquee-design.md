# Marquee — Design

**Date:** 2026-11-19
**Route:** `https://mikeosoft.ai/marquee/`
**Status:** Draft for approval

## 1. Intent

Michael wants to hold up an iPad Air (5th gen) at a concert as a light-up sign.
Before the moment, they design one sign on a **Setup page** (text + emojis, styling,
scroll, font). When the moment comes, they tap **Play** and the iPad becomes a
full-screen marquee readable from a distance in a dark venue.

It must run entirely in the browser (no backend), install to the Home Screen like an
app, and work with no signal at the venue.

### What success looks like

- Readable from across a dark venue; looks like a real light-up sign.
- Going from Setup → Play takes one tap; the sign cannot be exited by a bump in the crowd.
- Works in airplane mode once installed.
- Runs smoothly for a whole show without noticeably draining the battery.

## 2. Goals, non-goals, anti-goals

**Goals (this phase)**
- One sign, made of **text and emojis** (emojis come from the iPad keyboard).
- Text styling: font, size, colour, bold/italic/caps, outline, glow, letter spacing.
- Render modes: **Smooth** (normal text), **LED** (round dots), **PIXEL** (square dots) with adjustable pixel size.
- Display styling: background, border, scroll (off / ← → ↑ ↓) and speed, blink.
- Presets, Reset, live preview, auto-save on the device.
- Installable PWA scoped to `/marquee/`, offline-capable.

**Non-goals (this phase)**
- **Photos.** Planned for a later phase (picked from the iPad photo library, stored on-device in IndexedDB). This phase must not block that, but must not build for it either beyond a versioned settings schema.
- Multiple saved signs / playlists / switching between signs.
- Sharing, syncing, accounts, any server.
- iPhone or Android optimisation (should not break, but not designed for).
- Linking the tool from the landing page (it stays unlisted, like `/tools/downloadphotos/`).

**Anti-goals (failure even if it "works")**
- Text that is hard to read from a distance by default.
- Play view that exits on an accidental touch.
- Anything that needs the network at the venue (web fonts from a CDN, etc.).
- Choppy scrolling or a hot, fast-draining iPad.
- Flashing faster than 3 times per second.

## 3. Constraints

- **Repo:** `thatmichael85/michaelolimpo` — React 19 + TypeScript + Vite multi-page build, Vitest + React Testing Library, ESLint 0 warnings, deployed to GitHub Pages by `.github/workflows/deploypages.yml` (runs `npm test` and `npm run build`). `AGENTS.md` requires TDD.
- **Multi-page, no router:** each tool is its own HTML entry in `vite.config.ts` `build.rollupOptions.input`. Precedent: `tools/downloadphotos/index.html` → `src/tools/downloadphotos/main.tsx`.
- **Design system:** Michael approved **not using Astryx** for this tool. Like `downloadphotos/base.css`, the marquee gets its own independent palette, defined as CSS variables in its own stylesheet (no hard-coded hex values scattered in components). The landing page is untouched.
- **Device:** iPad Air 5th gen, 2360×1640 physical px, 1180×820 CSS px in landscape, devicePixelRatio 2, Safari / Home Screen web app on current iPadOS.
- **iPadOS web-app limits:** the manifest `orientation` is ignored on iPad; Screen Wake Lock works in Safari and Home Screen apps on recent iPadOS but must be verified on the device; iOS caps a single canvas at ~16.7 M pixels and total canvas memory is limited.
- **Offline:** every asset (JS, CSS, fonts, icons) must be self-hosted and precached. No Google Fonts CDN for this page.

## 4. Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A+ (chosen)** | React + plain CSS for Smooth mode; a `<canvas>` only for LED/PIXEL mode | Two renderers to keep in sync — mitigated by both reading the same settings object |
| B | Canvas for everything | One renderer, but loses native emoji/text crispness, glow/outline must be hand-built, higher battery use |
| A-lite | CSS dot-mask overlay on normal text, no canvas | Least code, but text looks perforated rather than pixelated (half-dots, no grid snap) |
| C | Plain TS, no React | Slightly smaller bundle; off-pattern for the repo, loses shared test setup |

**Chosen: A+.** Only option that gives a real LED look without degrading normal fonts, and it fits the repo.

## 5. What Michael decided

### 5.1 Pages

**Setup page — dark mode only.**

```
┌──────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────┐ │
│ │ ●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─● │ │ ← live preview, iPad aspect ratio,
│ │ ●        WE LOVE YOU TAYLOR 💜   →→            ● │ │   shows border, animates
│ │ ●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─●─● │ │
│ └──────────────────────────────────────────────────┘ │
│   [ text input with emojis                       ]   │
│ ┌─ TEXT ────────────────┐ ┌─ DISPLAY ──────────────┐ │
│ │ Font  [bundled set]   │ │ Background solid/grad. │ │
│ │ Render Smooth|LED|PIX │ │ Border none/solid/neon/│ │
│ │ Pixel size ──●──      │ │        bulbs           │ │
│ │ Unlit dots off/faint  │ │ Scroll off ← → ↑ ↓     │ │
│ │ Size ──●──  ☐ Fit     │ │   Speed ──●──          │ │
│ │ Colour ● ● ● / 🌈     │ │ Blink off/slow/fast    │ │
│ │ Bold Italic CAPS      │ │                        │ │
│ │ Outline ☐  Glow ☐     │ │                        │ │
│ │ Spacing ──●──         │ │                        │ │
│ └───────────────────────┘ └────────────────────────┘ │
│  Presets: [Neon] [Stadium] [Classic]  [Reset] [▶ Play]│
└──────────────────────────────────────────────────────┘
```

**Play view** — full screen, no controls visible, border drawn around the screen edge,
text inside it. **Press and hold ~1 s** anywhere reveals an **Edit** button (auto-hides
after a few seconds); tapping it returns to Setup.

### 5.2 Controls and behaviour

**Text**
- One text input; iPad keyboard provides emojis. Multi-line allowed (newlines shown when not scrolling horizontally).
- **Font:** a bundled set of ~6 bold display fonts, self-hosted.
- **Render mode:** `Smooth` | `LED` | `PIXEL`.
  - **LED** = round dots, **PIXEL** = square dots.
  - **Pixel size** slider (fine → chunky). The dot grid fills the whole display.
  - **Unlit dots:** off / faint (a real-board look).
  - Each dot is fully on or off; letters snap to the grid.
  - Emojis are pixelated in their own colours.
  - Scrolling moves **one whole dot per step**, like a real LED board.
- **Size** slider and **Fit to screen** toggle (largest size that fits; relevant for static signs).
- **Colour:** swatches + custom picker, plus **🌈 rainbow** (colour sweeps across letters).
- **Bold / Italic / CAPS**, **Outline**, **Glow**, **Letter spacing**.
- Emojis keep their own colours; colour/rainbow/glow/outline apply to letters only.

**Display**
- **Background:** solid colour or two-colour gradient.
- **Border:** none / solid (colour, thickness) / neon (glowing line) / **bulbs** (ring of light dots that chase like a theatre marquee).
- **Scroll:** off (centred, static) or ←, →, ↑, ↓ in a seamless loop, with a **speed** slider.
- **Blink:** off / slow / fast — both rates stay **at or under 3 flashes per second**.

**Actions**
- **Presets** — Neon, Stadium, Classic: one tap sets all settings; everything stays tweakable.
- **Reset** — back to defaults; requires a second tap to confirm (no browser `confirm()` dialog).
- **Play** — enters the Play view.

**Persistence** — the sign auto-saves on the device and is restored on next open.

### 5.3 Platform

- Lives at `/marquee/` via a new entry `marquee/index.html` → `src/tools/marquee/main.tsx`, added to `vite.config.ts` inputs.
- **PWA, "Add to Home Screen":** own name, icon, `display: standalone`, `start_url` and `scope` = `/marquee/`. Installing must not capture the landing page or `/tools/downloadphotos/`.
- **Offline:** service worker precaches everything the marquee needs.
- **Verification:** each piece is checked in Michael's Chrome (via the chrome-agent-bridge extension) at 1180×820 before publishing; iPad-only behaviours get a final on-device check (see §7).

## 6. Calls I made (Michael can override)

1. **Render mode is separate from font.** LED/PIXEL can be applied to any bundled font, rather than being two entries in the font list. More flexible, same UI weight.
2. **No "LED dots background" option.** Render mode LED/PIXEL covers that look; a second dot effect would confuse.
3. **Default sign** (first open and after Reset): black background, bold display font, white-hot text with glow, Smooth mode, scrolling ←, medium speed, no blink, no border. Readable from far away by default.
4. **Blink rates:** slow ≈ 1 flash/s, fast ≈ 2.5 flashes/s.
5. **Reduced motion:** sign animations (scroll, blink, bulbs) run as configured in Preview and Play even if iPadOS "Reduce Motion" is on — the motion *is* the content and Michael chose it explicitly. UI transitions on the Setup page do respect Reduce Motion. (This is a deliberate deviation from `AGENTS.md` §3.5 for the sign itself only.)
6. **Orientation:** designed for landscape. Because iPad ignores the manifest orientation lock, Play also renders correctly in portrait (it just fills whatever the screen is); no rotate prompt.
7. **Full screen in a Safari tab:** when not launched from the Home Screen, Play calls the Fullscreen API where available; from the Home Screen it is already chrome-free.
8. **Screen stays awake** in Play via the Screen Wake Lock API, re-acquired when the page becomes visible again. If unavailable, Play shows nothing extra; the on-device checklist includes "set Auto-Lock to Never" as a backup tip in the Setup page's help text.
9. **Storage:** settings in `localStorage` as one JSON object with a `version` field (photos later will add IndexedDB without migrating this).
10. **Unlisted**, no link from the landing page — same as the photo downloader.
11. **Scope of the 3-flashes-per-second cap:** applies to whole-sign on/off changes — **Blink** and the **bulb chase** (each bulb toggles ≤ 3 times/s). Scrolling (including LED/PIXEL whole-dot steps) and the rainbow sweep are *motion*, not flashing, and are not capped by this rule; the speed slider has its own sensible maximum.
12. **Blink** affects the text only; the border keeps its own animation (bulbs keep chasing, neon stays lit).
13. **Presets** change styling only and keep the message text. **Reset** restores default styling and keeps the message text too (clearing text is just deleting it in the input).
14. **Size in LED/PIXEL mode** means text height as a share of the dot rows (Fit = as tall as the rows allow); pixel size sets how many rows there are.
15. **Outline and Glow in LED/PIXEL mode:** Glow becomes a soft bloom around lit dots; Outline is disabled (greyed) in those modes since dots have no letter edges.

## 6a. Delivery

- **One pass:** everything in §5 ships together; no phased release, no time estimates.
- **Release flow (my call):** work on a feature branch, open a PR, Michael merges. Merging to `main` deploys via `deploypages.yml`; there is no preview host, so iPad checks run against the live, unlisted `/marquee/` URL after merge.
- **Service worker updates automatically** (new version activates on next launch) so a stale cached copy never hides a fix during testing.

## 7. Verification

**Automated (TDD, per `AGENTS.md`)** — `npm test`, `npm run build`, `npm run lint` all clean. Logic worth unit-testing as pure functions:
- settings defaults, validation/clamping, load/save with version and corrupt-data fallback;
- preset application and Reset;
- scroll duration from measured width + speed (constant visual speed regardless of text length);
- fit-to-screen sizing;
- blink rate cap (≤ 3 Hz);
- splitting text into letters vs emojis (grapheme-aware, so 👍🏽 and 👨‍👩‍👧 stay whole);
- LED/PIXEL rasterisation: from a coverage bitmap to an on/off dot grid (testable without a real canvas);
- press-and-hold timing for the Edit button;
- component tests that changing a control updates the preview.

**In Chrome (via chrome-agent-bridge) at 1180×820:** every control visibly affects preview and Play; scroll is smooth and loops seamlessly in all four directions; LED/PIXEL snap and step by whole dots; bulbs chase; press-and-hold exit works; settings survive reload; offline works after first load (DevTools offline).

**On the iPad (final, manual):** Add to Home Screen shows correct name/icon and opens chrome-free; airplane mode works; screen stays awake for 10+ minutes in Play; emojis render correctly in all modes; scroll is smooth at a long message and smallest pixel size; battery/heat acceptable over ~30 minutes; accidental taps don't exit Play.

## 8. Left to the builder

- Exact font list (~6, bold/legible from distance, Latin subset, self-hosted e.g. via `@fontsource`), colour swatches, slider ranges and defaults, and exact preset values (Neon / Stadium / Classic), within the intent above.
- PWA tooling (e.g. `vite-plugin-pwa`) and how the service worker is scoped to `/marquee/` and limited to the marquee's assets.
- App icon design (a simple marquee/bulb mark) and the Home Screen name ("Marquee").
- Smooth-mode implementation details: CSS transform keyframes vs. other GPU-composited approaches; how letters vs emojis are styled differently (glow/outline/rainbow must not ruin emojis).
- LED/PIXEL implementation details, within these constraints: dots snap to a grid sized from the pixel-size setting; scroll steps whole cells; per-frame work stays small (e.g. rasterise once per settings change, redraw only on each step); respect iOS canvas size/memory limits for long messages (e.g. tile the pre-rendered strip); crisp at devicePixelRatio 2.
- Bulb-border chase implementation and speed.
- Component/file structure under `src/tools/marquee/`.
- Setup page visual polish in dark mode.
