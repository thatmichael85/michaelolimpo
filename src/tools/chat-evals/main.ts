import { getLanguageModel, NANO_OPTIONS } from '../../components/chat/languageModel';
import { revealsInstructions, SYSTEM_PROMPT } from '../../components/chat/systemPrompt';
import { BLOCKED_REPLY } from '../../components/chat/useNanoChat';
import { CASES, type EvalCase } from './cases';
import { grade, type GradeResult } from './grade';

interface RunResult extends GradeResult {
  id: string;
  category: string;
  run: number;
  prompt: string;
  reply: string;
  ms: number;
}

declare global {
  interface Window {
    __chatEvals?: { done: boolean; progress: string; results: RunResult[]; summary?: Record<string, string> };
  }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const state: NonNullable<Window['__chatEvals']> = { done: false, progress: 'idle', results: [] };
window.__chatEvals = state;

async function ask(c: EvalCase): Promise<string> {
  const api = getLanguageModel();
  if (!api) throw new Error('Prompt API not available in this browser');
  const session = await api.create({
    ...NANO_OPTIONS,
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }, ...(c.history ?? [])],
  });
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 60_000);
  try {
    let reply = '';
    for await (const chunk of session.promptStreaming(c.prompt, { signal: timeout.signal })) {
      reply += chunk;
      if (revealsInstructions(reply)) return `${BLOCKED_REPLY} [guard: blocked instruction leak]`; // same guard as the panel
    }
    return reply;
  } finally {
    clearTimeout(timer);
    session.destroy();
  }
}

function render() {
  const rows = state.results
    .map((r) => {
      const tr = document.createElement('tr');
      tr.className = r.pass ? 'pass' : 'fail';
      for (const v of [r.pass ? '✅' : '❌', r.category, `${r.id} #${r.run}`, r.prompt, r.reply, r.failures.join('; ')]) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.append(td);
      }
      return tr;
    });
  $('rows').replaceChildren(...rows);
}

function summarise() {
  const byCat: Record<string, { pass: number; total: number }> = {};
  for (const r of state.results) {
    byCat[r.category] ??= { pass: 0, total: 0 };
    byCat[r.category].total++;
    if (r.pass) byCat[r.category].pass++;
  }
  const total = state.results.filter((r) => r.pass).length;
  const summary: Record<string, string> = Object.fromEntries([
    ['ALL', `${total}/${state.results.length}`],
    ...Object.entries(byCat).map(([k, v]) => [k, `${v.pass}/${v.total}`]),
  ]);
  state.summary = summary;
  $('summary').textContent = Object.entries(summary).map(([k, v]) => `${k}: ${v}`).join('   ·   ');
  $('json').textContent = JSON.stringify(state, null, 2);
}

async function runAll() {
  const runs = Math.max(1, Number(($('runs') as HTMLInputElement).value) || 3);
  ($('run') as HTMLButtonElement).disabled = true;
  state.done = false;
  state.results = [];
  const total = CASES.length * runs;
  for (let run = 1; run <= runs; run++) {
    for (const c of CASES) {
      state.progress = `${state.results.length + 1}/${total}: ${c.id} #${run}`;
      $('progress').textContent = state.progress;
      const t0 = performance.now();
      let reply: string;
      try {
        reply = await ask(c);
      } catch (e) {
        reply = `[ERROR] ${(e as Error).name}: ${(e as Error).message}`;
      }
      state.results.push({ id: c.id, category: c.category, run, prompt: c.prompt, reply, ms: Math.round(performance.now() - t0), ...grade(c, reply) });
      render();
      summarise();
    }
  }
  state.done = true;
  state.progress = 'done';
  $('progress').textContent = 'Done.';
  ($('run') as HTMLButtonElement).disabled = false;
}

(async () => {
  const api = getLanguageModel();
  const availability = api ? await api.availability(NANO_OPTIONS).catch(() => 'unavailable') : 'no Prompt API';
  $('avail').textContent = `Gemini Nano: ${availability} · ${CASES.length} cases`;
  $('run').addEventListener('click', () => void runAll());
})();
