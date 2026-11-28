# Homepage Chat (Gemini Nano) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a chat panel to the right of the homepage profile card. Visitors ask questions about Michael, and Gemini Nano answers from a fact sheet, running entirely in Chrome. Everyone who can't run Nano sees today's homepage unchanged.

**Architecture:**
- A tiny availability hook in the main bundle asks Chrome's Prompt API (`LanguageModel`) whether Nano exists.
- Only if it does, `LandingPage` lazy-loads the `ChatPanel` chunk and switches `.landing-wrapper` to a two-column grid.
- `ChatPanel` renders state from a `useNanoChat` hook, which owns the `LanguageModel` session (create/download, stream, stop, clear).
- The rules and facts live in Markdown files imported with `?raw`.

**Tech Stack:** React 19 + TypeScript (strict), Vite 7, Vitest 4 + React Testing Library (jsdom), the project's swizzled primitives (`Card`, `Button`, `Text`), CSS tokens in `src/design-system/tokens.css`, global styles in `src/index.css`.

**Spec:** `docs/superpowers/specs/2026-11-25-homepage-nano-chat-design.md`

## Global Constraints

- No new runtime or type dependencies. Type the Prompt API ourselves (Task 1).
- Prompt API options are always `{ expectedInputs: [{ type: 'text', languages: ['en'] }], expectedOutputs: [{ type: 'text', languages: ['en'] }] }`, passed to both `availability()` and `create()`.
- Do not set temperature or topK. Sampling parameters need an origin trial.
- Never call `LanguageModel.create()` except from `prepare()`/`ask()`, which the UI calls only from chat-input focus, a starter-question click, or Send. Never call it on mount or from page-wide listeners.
- Non-Nano visitors (`LanguageModel` missing, `unavailable`, or `availability()` throws) get no chat DOM, no wrapper modifier class, and no chat chunk fetched.
- Use only the primitives in `src/design-system/primitives/` (never raw Astryx components). Colours come only from `var(--…)` tokens, never hex values.
- Interaction physics: hover `translate(-2px,-2px)`, active `translate(1px,1px)`, `cubic-bezier(0.16, 1, 0.3, 1)` at 150ms. Respect `prefers-reduced-motion`.
- Validation per task: `npm test`, `npm run build`, `npm run lint` must all pass with 0 errors and 0 warnings. The suite has 158 tests today and must only grow.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A question is sent while Nano is still downloading or the session is still being created.** It must appear in the log immediately, be answered once ready, and not create a second session. (Tests in Task 3.)
2. **Clear or Stop is pressed mid-reply.** No late chunks may land in the cleared log. Stop keeps the partial answer, and Send works again. (Tests in Task 3.)
3. **The download or `create()` fails** (low disk space, or the user cancels in Chrome). The panel shows a notice, keeps working, and the next interaction retries. (Test in Task 3.)
4. **A long conversation overflows the context** (`QuotaExceededError`). The assistant bubble says to press Clear. (Test in Task 3.)
5. **Whitespace-only or very long input.** Whitespace-only is ignored. The input is capped at 500 characters with `maxLength`. (Tests in Tasks 3 and 4.)

---

## File Structure

```
src/components/chat/
├── languageModel.ts          # Prompt API types, NANO_OPTIONS, getLanguageModel(), checkNanoAvailability()
├── languageModel.test.ts
├── useNanoAvailability.ts    # hook: 'checking' | NanoAvailability
├── useNanoAvailability.test.tsx
├── rules.md                  # behaviour rules (system prompt part 1)
├── facts.md                  # public fact sheet (system prompt part 2)
├── systemPrompt.ts           # buildSystemPrompt(), SYSTEM_PROMPT
├── systemPrompt.test.ts
├── useNanoChat.ts            # session lifecycle + messages state
├── useNanoChat.test.tsx
├── ChatPanel.tsx             # UI (default export, lazy-loaded)
└── ChatPanel.test.tsx
src/test/fakeLanguageModel.ts # test double installed on globalThis.LanguageModel
src/pages/LandingPage.tsx     # modify: gate + lazy panel + wrapper modifier
src/pages/LandingPage.test.tsx# modify: add gate tests
src/index.css                 # modify: two-column layout + chat panel styles
AGENTS.md                     # modify: directory tree entry for src/components/chat/
```

---

### Task 1: Prompt API types, availability check, and the test fake

**Files:**
- Create: `src/components/chat/languageModel.ts`
- Create: `src/test/fakeLanguageModel.ts`
- Test: `src/components/chat/languageModel.test.ts`

**Interfaces:**
- Produces (`languageModel.ts`):
  ```ts
  export type NanoAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';
  export type UsableAvailability = Exclude<NanoAvailability, 'unavailable'>;
  export interface LanguageModelMessage { role: 'system' | 'user' | 'assistant'; content: string }
  export interface DownloadMonitor { addEventListener(type: 'downloadprogress', cb: (e: { loaded: number }) => void): void }
  export interface LanguageModelSession {
    promptStreaming(input: string, options?: { signal?: AbortSignal }): AsyncIterable<string>;
    destroy(): void;
  }
  export interface LanguageModelStatic {
    availability(options: typeof NANO_OPTIONS): Promise<NanoAvailability>;
    create(options: typeof NANO_OPTIONS & {
      initialPrompts?: LanguageModelMessage[];
      monitor?: (m: DownloadMonitor) => void;
      signal?: AbortSignal;
    }): Promise<LanguageModelSession>;
  }
  export const NANO_OPTIONS: { expectedInputs: [{ type: 'text'; languages: ['en'] }]; expectedOutputs: [{ type: 'text'; languages: ['en'] }] };
  export function getLanguageModel(): LanguageModelStatic | undefined; // reads globalThis.LanguageModel
  export function checkNanoAvailability(): Promise<NanoAvailability>;  // 'unavailable' if missing or throws
  ```
- Produces (`src/test/fakeLanguageModel.ts`):
  ```ts
  export interface FakeLanguageModelOptions {
    availability?: NanoAvailability | Error;   // default 'available'; an Error makes availability() reject
    replies?: string[][];                      // chunks per prompt, consumed in order; default [['Hello']]
    createError?: Error;                       // create() rejects with this (once, then succeeds)
    promptError?: Error;                       // promptStreaming throws this on first iteration
    holdCreate?: boolean;                      // create() stays pending until fake.resolveCreate()
    holdStream?: boolean;                      // each stream yields first chunk then waits for fake.releaseStream()
    downloadProgress?: number[];               // 'loaded' values emitted to monitor during create()
  }
  export interface FakeLanguageModel {
    availability: Mock; create: Mock;          // vitest spies
    sessions: Array<{ promptStreaming: Mock; destroy: Mock }>;
    resolveCreate(): void; releaseStream(): void;
  }
  export function installFakeLanguageModel(opts?: FakeLanguageModelOptions): FakeLanguageModel; // sets globalThis.LanguageModel
  export function uninstallFakeLanguageModel(): void;
  ```
  Streams are async generators. When `signal` aborts, a held stream throws `new DOMException('aborted', 'AbortError')`.

- [ ] **Step 1: Write the failing tests** (`languageModel.test.ts`, `afterEach(uninstallFakeLanguageModel)`)
  - `returns 'unavailable' when the Prompt API is missing`: no install, then `expect(await checkNanoAvailability()).toBe('unavailable')`.
  - `returns what Chrome reports`: for each of `'available'`, `'downloadable'`, `'downloading'`, `'unavailable'`, install with that value and expect it back.
  - `asks for English text in and out`: `expect(fake.availability).toHaveBeenCalledWith(NANO_OPTIONS)` and `expect(NANO_OPTIONS.expectedInputs[0].languages).toEqual(['en'])`.
  - `treats a throwing availability() as unavailable`: `installFakeLanguageModel({ availability: new Error('boom') })`, then expect `'unavailable'`.

- [ ] **Step 2: Run the tests to verify they fail**
  Run: `npx vitest run src/components/chat/languageModel.test.ts`. Expected: FAIL because the module isn't found.

- [ ] **Step 3: Implement `languageModel.ts` and `fakeLanguageModel.ts`** with the interfaces above. `getLanguageModel` reads `(globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel`.

- [ ] **Step 4: Run the tests to verify they pass**
  Run: `npx vitest run src/components/chat/languageModel.test.ts`. Expected: PASS (4 tests).

- [ ] **Step 5: Commit**: `feat(chat): Prompt API types and Nano availability check`

---

### Task 2: Rules, fact sheet, and system prompt

**Files:**
- Create: `src/components/chat/rules.md`, `src/components/chat/facts.md`, `src/components/chat/systemPrompt.ts`
- Test: `src/components/chat/systemPrompt.test.ts`

**Interfaces:**
- Produces: `export function buildSystemPrompt(rules: string, facts: string): string` returns `` `${rules.trim()}\n\nFACTS:\n${facts.trim()}` ``. Also `export const SYSTEM_PROMPT: string` = `buildSystemPrompt(rulesMd, factsMd)`, where both files are imported with `?raw`.

**Exact copy for `rules.md`:**
```
You are a friendly assistant on Michael's personal website (mikeosoft.ai). You answer visitors' questions about Michael.

RULES:
- Use ONLY the facts below. If the answer isn't in the facts, say you don't know and suggest contacting Michael on LinkedIn.
- Never invent jobs, dates, numbers, names, or opinions.
- If asked about anything unrelated to Michael, politely say you can only answer questions about Michael.
- Keep answers short: 1-3 sentences.
```

**Exact copy for `facts.md`** (only what the site already says; Michael expands it later):
```
- Name: Michael Angelo S Olimpo (goes by Michael).
- Headline: AI Guide & Systems Builder.
- Work: At Meta, guiding AI to build internal tools, helping fellow humans create, code, and lead with AI.
- Family: Father of 3 kids, "drowning in love and work."
- Website: mikeosoft.ai.
- Tools on his site: "Marquee" (make a light-up marquee sign for your iPad, works offline) and "ChildFirst Photo Export" (download your own child's photos from the ChildFirst app, right in your browser).
- Contact: LinkedIn, https://www.linkedin.com/in/michael-angelo-s-olimpo/
```

- [ ] **Step 1: Write the failing tests**
  - `puts rules first, then a FACTS section`: `expect(buildSystemPrompt(' R ', ' F ')).toBe('R\n\nFACTS:\nF')`.
  - `SYSTEM_PROMPT contains the rules and the facts`: it contains `'Use ONLY the facts below'`, `'FACTS:'` and `'https://www.linkedin.com/in/michael-angelo-s-olimpo/'`, and `indexOf('RULES:') < indexOf('FACTS:')`.

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/components/chat/systemPrompt.test.ts`. Expected: FAIL.

- [ ] **Step 3: Create both `.md` files with the exact copy above, then implement `systemPrompt.ts`.** `?raw` imports are typed by the existing `vite/client` reference.

- [ ] **Step 4: Run to verify they pass.** Expected: PASS (2 tests).

- [ ] **Step 5: Commit**: `feat(chat): rules, fact sheet, and system prompt`

---

### Task 3: `useNanoChat` hook

**Files:**
- Create: `src/components/chat/useNanoChat.ts`
- Test: `src/components/chat/useNanoChat.test.tsx`

**Interfaces:**
- Consumes: `getLanguageModel`, `NANO_OPTIONS`, `UsableAvailability`, `LanguageModelSession` (Task 1); `installFakeLanguageModel` (tests).
- Produces:
  ```ts
  export interface ChatMessage { id: number; role: 'user' | 'assistant'; text: string; error?: boolean }
  export type ChatPhase = 'idle' | 'preparing' | 'ready' | 'replying';
  export interface NanoChat {
    phase: ChatPhase;                 // idle = no session yet; preparing = create() in flight; replying = waiting on/streaming an answer
    needsDownload: boolean;           // true while initial availability was not 'available' and no session has ever been created (stays false after clear())
    downloadProgress: number | null;  // 0..1 from Chrome's monitor while preparing, else null
    messages: ChatMessage[];
    notice: string | null;            // setup failure text, cleared on next prepare()
    prepare(): void;                  // idempotent; starts create() if no session and none in flight
    ask(question: string): void;      // trims; ignores empty or when phase === 'replying'
    stop(): void;                     // aborts the current reply, keeping partial text
    clear(): void;                    // aborts, destroys the session, empties messages → phase 'idle'
  }
  export function useNanoChat(availability: UsableAvailability, systemPrompt: string): NanoChat;
  ```
- Behaviour that the tests pin down:
  - `create()` is called with `{ ...NANO_OPTIONS, initialPrompts: [{ role: 'system', content: systemPrompt }], monitor }`.
  - One in-flight create promise is shared by `prepare()` and `ask()`.
  - `ask()` appends the user message and an empty assistant message at once, sets `phase = 'replying'`, awaits the session, then appends each streamed chunk to the assistant message.
  - A generation counter, bumped by `clear()`, discards results from a stale reply.
  - Unmount aborts and destroys the session.
  - Error copy (exact):
    - setup failure notice: `"Couldn't start Chrome's on-device AI. Try again."`
    - reply failure: `"Sorry, something went wrong. Please try again."`
    - `QuotaExceededError`: `"This conversation got too long. Press Clear to start over."`

- [ ] **Step 1: Write the failing tests** (`renderHook(() => useNanoChat(avail, 'SYS'))`, wrapping state changes in `act`/`waitFor`, with `afterEach(uninstallFakeLanguageModel)`)
  - `does not create a session on mount`: `expect(fake.create).not.toHaveBeenCalled()`, `phase === 'idle'`.
  - `prepare() creates one session with the system prompt`: call prepare twice, then `expect(fake.create).toHaveBeenCalledTimes(1)`, the call arg includes `initialPrompts: [{ role: 'system', content: 'SYS' }]` and `expectedInputs`, and `phase` becomes `'ready'`.
  - `needsDownload reflects availability until a session exists`: `'downloadable'` gives `true`; after prepare resolves, `false`. `'available'` gives `false`.
  - `reports download progress while preparing`: `downloadProgress: [0.25, 1]` with `holdCreate`, then `downloadProgress === 1` while `phase === 'preparing'`, and `null` after resolving.
  - `ask() streams the reply into one assistant message`: `replies: [['Hi', ' there']]`, then messages equal `[{role:'user',text:'Q'}, {role:'assistant',text:'Hi there'}]` (match with `expect.objectContaining`), and `phase === 'ready'`.
  - `a question asked while preparing waits and is answered` (Review Focus 1): `holdCreate`, `ask('Q')`, then the user message is visible and `phase === 'replying'`. Call `resolveCreate()`, then the answer arrives and `fake.create` was called once.
  - `ignores blank questions and questions while replying` (Review Focus 5): `ask('   ')` leaves messages empty. With `holdStream`, a second `ask` during a reply adds nothing.
  - `stop() keeps partial text and frees Send` (Review Focus 2): `holdStream`, `replies: [['Part', 'Rest']]`, `stop()`, then the assistant text is `'Part'` and `phase === 'ready'`.
  - `clear() mid-reply discards late chunks and destroys the session` (Review Focus 2): `holdStream`, `clear()`, `releaseStream()`, then `messages` is `[]`, `fake.sessions[0].destroy` has been called, and `phase === 'idle'`.
  - `setup failure shows a notice and retries on next prepare` (Review Focus 3): `createError`, `prepare()`, then `notice === "Couldn't start Chrome's on-device AI. Try again."` and `phase === 'idle'`. Calling `prepare()` again succeeds, `notice === null`, and `phase === 'ready'`.
  - `reply failure marks the assistant message as an error`: `promptError: new Error('x')`, then the last message has `{ error: true, text: 'Sorry, something went wrong. Please try again.' }`.
  - `context overflow tells the visitor to Clear` (Review Focus 4): `promptError: new DOMException('full', 'QuotaExceededError')`, then the text is `'This conversation got too long. Press Clear to start over.'`.
  - `destroys the session on unmount`: prepare, `unmount()`, then `destroy` has been called.

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/components/chat/useNanoChat.test.tsx`. Expected: FAIL because the module isn't found.

- [ ] **Step 3: Implement `useNanoChat`.** Keep the session, in-flight create promise, AbortController and generation counter in refs, and messages/phase/progress/notice in state. Build streamed text by updating the last assistant message immutably (by `id`).

- [ ] **Step 4: Run to verify they pass.** Expected: PASS (13 tests).

- [ ] **Step 5: Commit**: `feat(chat): useNanoChat session and streaming hook`

---

### Task 4: `ChatPanel` UI

**Files:**
- Create: `src/components/chat/ChatPanel.tsx`
- Modify: `src/index.css` (append a `/* Homepage chat */` section)
- Test: `src/components/chat/ChatPanel.test.tsx`

**Interfaces:**
- Consumes: `useNanoChat`, `ChatMessage` (Task 3); `SYSTEM_PROMPT` (Task 2); `Card`, `Button`, `Text` primitives.
- Produces: `export default function ChatPanel({ availability }: { availability: UsableAvailability }): JSX.Element`. It's a default export so it can be lazy-loaded (this also satisfies the `react-refresh` lint rule). The root element is `<Card className="chat-panel">` with `aria-label="Chat about Michael"` on a `<section>` inside.

**Exact copy and structure:**
- Heading: `💬 Ask about Michael`.
- Download note, only when `needsDownload`: `Runs privately in Chrome. Its built-in AI downloads once the first time you ask.`
- Progress, only while `downloadProgress !== null`: `<progress max={1} value={p} aria-label="Downloading Chrome's AI">`.
- Message log: `<div role="log" aria-live="polite" className="chat-log">`. Each message is a `<div className="chat-msg chat-msg--user|assistant">`, with `chat-msg--error` added when `error`. An assistant message with empty text renders `…`.
- Starter questions, shown only while `messages.length === 0`: `What does Michael do?` · `What has he built?` · `How can I reach him?`. Each is a `Button variant="secondary" size="sm"`; clicking one calls `prepare()` and then `ask(text)`.
- Form: `<input aria-label="Your question" placeholder="Ask about Michael…" maxLength={500}>`. `onFocus` calls `prepare()`. Send is a `Button type="submit"`, disabled while `phase === 'replying'`. Stop is shown only while replying and calls `stop()`. Clear (`variant="ghost" size="sm"`) calls `clear()`.
- `notice`, when set, renders as `<Text variant="secondary" role="status">`.
- Footer note: `AI-generated and may be wrong.` (`Text variant="muted"`).

- [ ] **Step 1: Write the failing tests** (use the fake from Task 1 and `userEvent`/`fireEvent`)
  - `shows the heading and starter questions`.
  - `focusing the input starts preparing, but rendering alone does not`: `expect(fake.create).not.toHaveBeenCalled()`, then after `focus(input)`, called once.
  - `shows the download note only when a download is needed`: with `'downloadable'` the note is present; with `'available'` it's absent.
  - `clicking a starter question asks it and shows the streamed answer`: `replies: [['Michael guides AI at Meta.']]`, click `What does Michael do?`, then both texts appear in the `log` role and the starter buttons are gone.
  - `typing and submitting sends the question and clears the input`.
  - `caps input at 500 characters` (Review Focus 5): `expect(input).toHaveAttribute('maxLength', '500')`.
  - `shows Stop while replying and disables Send` (with `holdStream`).
  - `Clear empties the log and brings starter questions back`.
  - `shows the setup notice` (with `createError`): the text from Task 3 appears in `role="status"`.

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/components/chat/ChatPanel.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement `ChatPanel.tsx` and its CSS.** CSS values:
  - `.chat-panel`: column flex, `height: 100%`, `min-height: 0`.
  - `.chat-log`: `flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 10px; align-content: start`.
  - `.chat-msg`: `border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 12px; white-space: pre-wrap; max-width: 90%`.
  - `--user`: `justify-self: end; background: var(--btn-primary-bg); color: var(--btn-primary-text)`.
  - `--assistant`: `justify-self: start; background: var(--bg-bio-box); color: var(--text-primary)`.
  - `--error`: `border-style: dashed`.
  - Input: tokens for background, text and border; `border-radius: var(--radius-sm)`.
  - Panel enter animation: `@keyframes chat-fade-in { from { opacity: 0 } to { opacity: 1 } }`, `250ms var(--ease-emphasized)`, and `animation: none` inside the existing `@media (prefers-reduced-motion: reduce)` block.

- [ ] **Step 4: Run to verify they pass.** Expected: PASS (9 tests).

- [ ] **Step 5: Commit**: `feat(chat): ChatPanel UI`

---

### Task 5: Homepage gate, lazy loading and two-column layout

**Files:**
- Create: `src/components/chat/useNanoAvailability.ts`, `src/components/chat/useNanoAvailability.test.tsx`
- Modify: `src/pages/LandingPage.tsx`, `src/pages/LandingPage.test.tsx`, `src/index.css`

**Interfaces:**
- Consumes: `checkNanoAvailability`, `UsableAvailability` (Task 1); `ChatPanel` default export (Task 4), loaded **only** via `lazy(() => import('../components/chat/ChatPanel'))`, never as a static import.
- Produces: `export function useNanoAvailability(): 'checking' | NanoAvailability`. It runs the check once on mount and ignores the result if the component has unmounted.
- `LandingPage` renders `<main className={'landing-wrapper' + (showChat ? ' landing-wrapper--with-chat' : '')}>`, where `showChat` means the availability is not `'checking'` and not `'unavailable'`. Inside, the existing `<Card>` is unchanged, followed by `{showChat && <div className="chat-column"><Suspense fallback={null}><ChatPanel availability={…} /></Suspense></div>}`.

- [ ] **Step 1: Write the failing tests**
  - `useNanoAvailability`: `starts as 'checking' then reports Chrome's answer` (fake `'downloadable'`, then `waitFor` result `'downloadable'`); `reports 'unavailable' without the API`.
  - `LandingPage`: the existing test stays as-is (jsdom has no `LanguageModel`), plus:
    - `shows no chat and keeps the single-column layout without Nano`: run it twice:
      - with `installFakeLanguageModel({ availability: 'unavailable' })`, `await waitFor(() => expect(fake.availability).toHaveBeenCalled())` first;
      - with nothing installed, `await act(async () => {})` first to flush the check.

      Both expect no `.chat-panel`, and `.landing-wrapper` without `landing-wrapper--with-chat`.
    - `shows the chat to the right when Nano is available`: install `'available'`, then `expect(await screen.findByRole('heading', { name: /Ask about Michael/ })).toBeInTheDocument()` and the wrapper has `landing-wrapper--with-chat`.

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/components/chat/useNanoAvailability.test.tsx src/pages/LandingPage.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement the hook and the `LandingPage` changes, then add the layout CSS:**
  ```
  .landing-wrapper--with-chat { max-width: 1080px; display: grid; grid-template-columns: minmax(0, 600px) minmax(320px, 1fr); gap: 24px; align-items: stretch; }
  .chat-column { position: relative; animation: chat-fade-in 250ms var(--ease-emphasized); }
  .chat-column > .chat-panel { position: absolute; inset: 0; }       /* panel matches card height, never grows it */
  @media (max-width: 999px) {
    .landing-wrapper--with-chat { max-width: 600px; grid-template-columns: 1fr; }
    .chat-column > .chat-panel { position: static; height: 480px; }  /* stacked under the card */
  }
  ```
  Add `.chat-column { animation: none; }` to the reduced-motion block. Confirm that `.landing-wrapper`'s existing auto margins still centre the grid.

- [ ] **Step 4: Run the whole validation suite**
  Run: `npm test && npm run build && npm run lint`. Expected: all tests pass (158 + the new ones), the build has 0 TypeScript errors, and lint has 0 warnings.

- [ ] **Step 5: Verify the chat is a separate chunk.**
  Run: `grep -l "Ask about Michael" dist/assets/*.js`. Expected: exactly one file, and **not** the `index-*.js` file referenced by `dist/index.html` (check with `grep -o 'assets/index-[^"]*\.js' dist/index.html`).

- [ ] **Step 6: Commit**: `feat(landing): show Nano chat beside the profile card when available`

---

### Task 6: Real-browser check, docs and spike cleanup

**Files:**
- Modify: `AGENTS.md` (directory tree: add `src/components/chat/` with one line per file, plus `src/test/fakeLanguageModel.ts`)
- Delete: untracked `tools/chat/` (the spike), and the local branch `spike/chat-poc`

- [ ] **Step 1: Manual check in desktop Chrome 148+** (`npm run dev`, open `/`). Confirm each:
  - The chat appears to the right and fades in, and the profile card is unchanged.
  - Focusing the input starts the download/progress only on first focus.
  - A starter question streams a correct answer.
  - "Where did he go to school?" gives "don't know" plus LinkedIn.
  - Asking for a pirate poem gets a polite decline.
  - Stop and Clear work.
  - Below 1000px wide, the chat stacks under the card.
  - Light and dark themes both work.
  - In Safari or a phone-sized emulation without `LanguageModel`, there's no chat and the Network panel shows no `ChatPanel` chunk.

  Record anything that fails as a fix inside this task before continuing.
- [ ] **Step 2: Update `AGENTS.md`'s directory tree.** Run `npm run lint` (expected: clean).
- [ ] **Step 3: Remove the spike**: `rm -rf tools/chat && git branch -D spike/chat-poc`. Expected: `git status` shows no `tools/chat/`.
- [ ] **Step 4: Commit**: `docs: document homepage chat files`
