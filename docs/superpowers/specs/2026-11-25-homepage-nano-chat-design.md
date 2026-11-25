# Homepage Chat (Gemini Nano) — Design

**Date:** 2026-11-25
**Route:** `https://mikeosoft.ai/` (homepage)
**Status:** Draft for approval
**Size:** Small feature (short design)

## 1. Intent

Michael wants visitors to his static, read-only site (GitHub Pages, no backend) to be able
to **ask simple questions about him** in a chat, powered by an LLM. It must cost him
nothing to run and need no server or API keys to secure, so the model runs **on the
visitor's device**.

After a local spike comparing WebLLM models with Chrome's built-in model, he chose
**Gemini Nano via Chrome's Prompt API** (`LanguageModel`, stable for web pages since
Chrome 148). It needs no download from his site, is shared across every site that uses it,
and is likely smarter than a ~1B WebLLM model.

### What success looks like

- On desktop Chrome with Nano, a visitor sees a chat panel **to the right of the profile
  card**, asks "What does Michael do?" and gets a short, correct answer streamed in.
- Questions the facts don't cover get "I don't know" plus a pointer to LinkedIn, not an
  invented answer.
- Everyone else (phones, Safari, Firefox, PCs without Nano) sees **today's homepage,
  unchanged**, and downloads none of the chat code.

## 2. Goals, non-goals, anti-goals

**Goals**
- Chat panel on the homepage, shown only when Nano is `available`, `downloadable` or `downloading`.
- Answers grounded in a fact sheet; on-topic only; short replies; streaming; Stop; Clear.
- 2–3 starter questions.
- A visible "AI-generated, may be wrong" note.
- Matches the design system (ink border, pop shadow, tokens, light/dark, AAA contrast).

**Non-goals**
- Any fallback for non-Nano visitors: no WebLLM, no FAQ, no "open in Chrome" placeholder.
- Saving chat history between visits; analytics or logging of questions.
- Languages other than English.

**Anti-goals** (would make it a failure even if it works)
- Slowing down or changing the homepage for visitors who can't use the chat.
- Confidently inventing facts about Michael.
- Putting anything private in the fact sheet: it ships to every browser and is readable in the page source.
- The profile card visibly jumping when the chat appears.

## 3. Constraints

- Static hosting only (GitHub Pages); no server, no secrets.
- The Prompt API is desktop Chrome 148+ only (Windows 10/11, macOS 13+, Linux,
  Chromebook Plus). It needs 22GB free disk and >4GB VRAM, or 16GB RAM with 4+ cores. It
  doesn't run in Web Workers, and sampling parameters (temperature) need an origin trial,
  so we don't set them.
- `LanguageModel.create()` triggers Chrome's model download when needed, and that requires a user gesture.
- Project rules (`AGENTS.md`): TDD, swizzled design-system primitives (never raw Astryx
  components), token-only colours, WCAG AAA, the house interaction physics, and
  `prefers-reduced-motion`.

## 4. Approaches

| Approach | Trade-off | Decision |
|---|---|---|
| **Call `LanguageModel` directly from a small React hook + panel** | Least code, no dependencies; we own a few edge cases | **Chosen** |
| AI SDK wrapper for Chrome built-in AI (e.g. Vercel AI SDK provider) | Extra dependency for ~5 API calls; only pays off if we later add cloud models | Rejected |
| Prompt API polyfill for other browsers | Sends prompts to a cloud model, bringing back cost and keys | Rejected |
| WebLLM (spike runner-up) | Works in more browsers, but 0.4–0.7GB download from the homepage and weaker answers | Rejected by Michael in favour of Nano |
| Reuse the spike's `tools/chat/index.html` | Throwaway, untested single file | Rejected; rebuild with tests, keep its lessons |

## 5. Decided design

**Availability gate (in the main bundle, tiny):**
- If `'LanguageModel' in self` is false → render nothing.
- Otherwise call `LanguageModel.availability({ expectedInputs/expectedOutputs: text, ['en'] })`.
  - `unavailable` → render nothing.
  - `available` / `downloadable` / `downloading` → lazy-load the chat panel (`React.lazy` + dynamic `import()`),
    so the chat code is a separate chunk only these visitors fetch.

**Chat panel states:**
- `available`: ready to type; the session is created on first focus or first question.
- `downloadable` / `downloading`: the panel looks the same as when ready, plus a one-line note
  that Chrome's on-device AI downloads once. **There is no "Enable" button.** The download starts
  on the visitor's **first interaction with the chat** (focusing the input by click or Tab, or
  tapping a starter question). That event is the user gesture Chrome requires for
  `create()`, which is called with a `downloadprogress` monitor. A progress bar shows the
  download. A question sent meanwhile appears in the log and is answered once the download finishes.
- Chrome forbids starting the download without a gesture, and we deliberately do **not** hook
  clicks elsewhere on the page: visitors who never touch the chat must not download anything.
- Error (create or prompt fails): an inline message; the panel stays, and the next interaction retries.

**Conversation:**
- One `LanguageModel` session per conversation, created with `initialPrompts: [{ role: 'system', content: rules + facts }]`.
  Chrome keeps the history and drops the oldest turns on overflow while keeping the system prompt.
- `promptStreaming(question, { signal })` streams the reply into the last message. Stop = `AbortController.abort()`.
- Clear = destroy the session, empty the log, and create a fresh session on the next question.
- One question at a time: Send is disabled while a reply streams.

**Content:**
- `src/components/chat/rules.md`: behaviour rules (from the spike): use only the facts; say
  you don't know and point to LinkedIn; decline off-topic requests politely; 1–3 sentences;
  never invent jobs, dates, numbers or names.
- `src/components/chat/facts.md`: starts with what the site already says (name, headline,
  Meta role, father of 3, mikeosoft.ai, the two tools, LinkedIn). **Michael expands it later.**
- Both are imported with Vite `?raw` and combined into the system prompt.

**Layout:**
- Today `.landing-wrapper` is a centred 600px column. When the chat is shown, it becomes a
  two-column grid: the profile card (unchanged width) on the left, the chat panel on the right. The
  panel stretches to the card's height and scrolls its message list internally.
- Below a breakpoint where two columns don't fit (~1000px), the chat stacks **under** the card.
- With no chat, the layout is exactly as today.
- The panel fades in (with no motion under `prefers-reduced-motion`), so the card's shift left
  is softened rather than a jolt.

**Replies (added after first real-Nano test):** Nano writes Markdown, so assistant replies render a safe subset
(paragraphs, line breaks, lists, http(s)/mailto links in a new tab, bold, italic, inline code) via a small in-house
renderer that builds React elements, never raw HTML. Visitor messages stay plain text.

**Look:**
- The panel uses the `Card`, `Button` and `Text` primitives and tokens only. User bubbles use the
  butter-yellow primary token with ink text; assistant bubbles use `--bg-bio-box`.
- Messages are in an `aria-live="polite"` log, and the input has a label. Contrast is AAA in both themes.

## 6. Left to the builder

- Exact component and file names (e.g. `useNanoChat`, `ChatPanel`, `ChatGate`), and how the
  `LanguageModel` global is typed and mocked in tests.
- The breakpoint value, panel min/max widths, and wrapper max-width for two columns.
- Exact starter-question wording and the copy for the explainer and errors.
- Deleting the spike (`tools/chat/` and the `spike/chat-poc` branch) once this lands.
