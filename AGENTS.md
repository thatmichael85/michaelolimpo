# AGENTS.md · Guidelines for AI Coding Agents

Welcome to **michaelolimpo** (`mikeosoft.ai`). This document defines the engineering standards, design system architecture, and development guidelines for AI agents working in this repository.

---

## 1. Tech Stack & Core Philosophy

- **Framework**: React 19 + TypeScript + Vite
- **Design System**: Meta's [Astryx](https://astryx.atmeta.com) (`@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@stylexjs/stylex`)
- **Testing**: Vitest + React Testing Library + `@testing-library/jest-dom`
- **Visual Aesthetic**: Playful Minimalist (Cartoony yet clean ink outlines, pop shadows, soft pastels, dot-grid canvas)
- **Quality Standard**: Test-Driven Development (TDD) + Strict TypeScript + ESLint (0 warnings/errors)

---

## 2. Directory Architecture

```
public/
└── assets/                      # Static media assets
    ├── avatar.png               # Profile portrait
    ├── banner.png               # Light mode doodle banner (pastels on cream)
    └── banner-dark.png          # Dark mode doodle banner (midnight neon pastels)

src/
├── design-system/               # Astryx theme bindings, tokens & primitives
│   ├── theme.ts                 # Astryx Theme export (neutralTheme)
│   ├── tokens.css               # Audited light/dark CSS variables & motion tokens
│   └── primitives/              # Swizzled Astryx primitives (custom ink & pop shadows)
│       ├── Avatar.tsx           # Avatar with ink border & doodle badge
│       ├── Button.tsx           # Tactile action button with pop shadows
│       ├── Card.tsx             # Main card container with ink border & banner clip
│       ├── Heading.tsx          # Type-safe Heading primitive
│       └── Text.tsx             # Text primitive with color hierarchy
│
├── components/                  # Composed feature blocks
│   ├── layout/                  # Shell components
│   │   ├── ThemeToggle.tsx      # Floating 3-state toggle (🖥️ System / ☀️ Light / 🌙 Dark)
│   │   └── Footer.tsx           # Dynamic domain (window.location.hostname) + Year
│   ├── landing/                 # Landing page sections
│   │   ├── ProfileHeader.tsx    # Dual banner cross-fade + Avatar + Headline
│   │   ├── BioBlock.tsx         # Bio statement + quote box
│   │   └── ConnectCTA.tsx       # High-contrast LinkedIn button
│   └── chat/                    # Homepage "Ask about Michael" chat (Chrome's on-device Gemini Nano)
│       ├── languageModel.ts     # Prompt API types, NANO_OPTIONS, checkNanoAvailability()
│       ├── useNanoAvailability.ts # Gate: shown only if Nano is available/downloadable
│       ├── useNanoChat.ts       # Session lifecycle: download on first interaction, stream, stop, clear
│       ├── ChatPanel.tsx        # Lazy-loaded UI (separate chunk; non-Nano visitors never fetch it)
│       ├── systemPrompt.ts      # rules.md + facts.md → system prompt
│       ├── rules.md             # Bot behaviour rules
│       └── facts.md             # PUBLIC fact sheet about Michael (ships to every browser)
│
├── pages/                       # Page-level views (scalable for future routes)
│   └── LandingPage.tsx          # Current landing page view
│
├── utils/                       # Shared helpers
│   ├── hostname.ts              # Hostname formatter with mikeosoft.ai fallback
│   └── theme.ts                 # 3-state theme resolver & matchMedia listener
│
├── test/                        # Vitest setup & testing helpers (fakeLanguageModel.ts = Prompt API test double)
├── App.tsx                      # App root with Astryx Theme provider & reactive state
├── main.tsx                     # Vite bootstrap entry
└── index.css                    # Global Astryx CSS imports + canvas background
```

---

## 3. Design System & Accessibility Rules (MANDATORY)

1. **Astryx Theme Engine & Swizzled Primitives**:
   - The app root is wrapped in `<Theme theme={neutralTheme}>` from `@astryxdesign/core/theme`.
   - Primitives in `src/design-system/primitives/` are **custom-swizzled components**.
   - ⚠️ **DO NOT** replace swizzled primitives with raw internal Astryx component imports (e.g. `<AstryxButton>`, `<AstryxAvatar>`), as their built-in StyleX styling and popover anchors will collide with our custom cartoon pop-shadow layout.

2. **Strict Token Usage**:
   - Never hardcode arbitrary hex colors in component styles. Always reference CSS variables defined in `src/design-system/tokens.css`.
   - Use `var(--text-primary)`, `var(--text-secondary)`, `var(--bg-card)`, `var(--border-color)`, `var(--shadow-pop)`.

3. **3-State Theme System & Dual Banners**:
   - The theme toggle cycles: `System (🖥️)` ➔ `Light (☀️)` ➔ `Dark (🌙)` ➔ `System (🖥️)`.
   - Default is `system` (dynamically follows OS `prefers-color-scheme` via `matchMedia`).
   - The header displays dual banners with smooth CSS opacity cross-fade:
     - Light Mode: `banner.png` (daytime pastel doodles)
     - Dark Mode: `banner-dark.png` (midnight celestial neon pastels)

4. **WCAG AAA Contrast in Light & Dark Modes**:
   - Buttons, badges, and text MUST pass high-contrast standards in all themes.
   - Example: On yellow/gold buttons (`--btn-linkedin-bg`), text MUST be pitch dark ink (`#09090b` / `#18181b`) to ensure a 15.8:1 AAA contrast ratio.

5. **Astryx & Material Interaction Physics**:
   - **Hover**: Subtle lift `transform: translate(-2px, -2px)` with shadow expanding (`var(--shadow-pop-hover)`).
   - **Active (Pressed)**: Physical press `transform: translate(1px, 1px)` with shadow collapsing.
   - **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` with `150ms` fast transition.
   - **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)`.

---

## 4. TDD & Verification Workflow

When modifying or adding features:
1. **Write or update tests FIRST** in `*.test.tsx` (TDD Red phase).
2. Implement code to satisfy tests (TDD Green phase).
3. Run the validation suite:
   ```bash
   npm test        # All tests must pass (currently 21 tests)
   npm run build   # Must compile with 0 TypeScript errors
   npm run lint    # Must pass with 0 ESLint warnings
   ```
