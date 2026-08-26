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
src/
├── assets/                      # Raw asset references
├── design-system/               # Astryx theme bindings, tokens & primitives
│   ├── theme.ts                 # Astryx Theme export (neutralTheme)
│   ├── tokens.css               # Audited light/dark CSS variables & motion tokens
│   └── primitives/              # Swizzled / wrapped Astryx primitives
│       ├── Avatar.tsx           # Avatar with ink border & doodle badge
│       ├── Button.tsx           # Tactile action button with pop shadows
│       ├── Card.tsx             # Main card container with ink border
│       ├── Heading.tsx          # Type-safe Heading primitive
│       └── Text.tsx             # Text primitive with color hierarchy
│
├── components/                  # Composed feature blocks
│   ├── layout/                  # Shell components
│   │   ├── TopNav.tsx           # Header bar + Theme toggle (☀️ / 🌙)
│   │   └── Footer.tsx           # Dynamic domain (window.location.hostname) + Year
│   └── landing/                 # Landing page sections
│       ├── ProfileHeader.tsx    # Banner + Avatar + "AI Guide human"
│       ├── BioBlock.tsx         # Bio statement + quote
│       └── ConnectCTA.tsx       # High-contrast LinkedIn button
│
├── pages/                       # Page-level views (scalable for future routes)
│   └── LandingPage.tsx          # Current landing page view
│
├── utils/                       # Shared helpers (e.g. hostname.ts)
├── test/                        # Vitest setup & testing helpers
├── App.tsx                      # App root with Theme provider & state
├── main.tsx                     # Vite bootstrap entry
└── index.css                    # Global Astryx CSS imports + canvas background
```

---

## 3. Design System & Accessibility Rules (MANDATORY)

1. **Strict Token Usage**:
   - Never hardcode arbitrary hex colors in component styles. Always reference CSS variables defined in [src/design-system/tokens.css](file:///Volumes/Secondary/Projects/michaelolimpo/src/design-system/tokens.css).
   - Use `var(--text-primary)`, `var(--text-secondary)`, `var(--bg-card)`, `var(--border-color)`, `var(--shadow-pop)`.

2. **WCAG AAA Contrast in Light & Dark Modes**:
   - Buttons, badges, and text MUST pass high-contrast standards in both themes.
   - Example: On yellow/gold buttons (`--btn-linkedin-bg`), text MUST be pitch dark ink (`#09090b` / `#18181b`) to ensure a 15.8:1 AAA contrast ratio.

3. **Astryx & Material Interaction Physics**:
   - **Hover**: Subtle lift `transform: translate(-2px, -2px)` with shadow expanding (`var(--shadow-pop-hover)`).
   - **Active (Pressed)**: Physical press `transform: translate(1px, 1px)` with shadow collapsing.
   - **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` with `150ms` fast transition.

4. **No Heavy External UI Frameworks**:
   - Do NOT install Tailwind, Chakra, MUI, or Bootstrap.
   - Build upon Astryx primitives in `src/design-system/primitives/`.

---

## 4. TDD & Verification Workflow

When modifying or adding features:
1. **Write or update tests FIRST** in `*.test.tsx` (TDD Red phase).
2. Implement code to satisfy tests (TDD Green phase).
3. Run the validation suite:
   ```bash
   npm test        # All tests must pass
   npm run build   # Must compile with 0 TypeScript errors
   npm run lint    # Must pass with 0 ESLint warnings
   ```
