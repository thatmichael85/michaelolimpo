import { readFileSync } from 'node:fs'
import { runInContext } from 'node:vm'
import { JSDOM } from 'jsdom'
import { expect, it } from 'vitest'

it('loads consecutive gallery pages across months and stops at the end', async () => {
  const html = readFileSync('public/tools/downloadphotos/index.html', 'utf8')
  const dom = new JSDOM(html, { url: 'https://example.test', runScripts: 'outside-only' })
  try {
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
    const result = await runInContext(script + `
      (async () => {
        const calls = [];
        taggedPage = async (cid, p) => {
          calls.push([cid, p]);
          return {
            results: [{id: p, date: p === 1 ? '2026-11-01' : '2026-10-01', thumb: 'data:,', url: 'data:,'}],
            next: p === 1, count: 2,
          };
        };
        $('sentinel').getBoundingClientRect = () => ({top: 100000});
        current = 123;
        await loadPreviews();
        const canLoadMore = !$('more').hidden;
        await loadPreviews();
        maybeLoadMore();
        return {
          calls, canLoadMore, finished: $('more').hidden,
          status: $('moreStatus').textContent,
          months: [...$('gallery').children].map(section => section._key),
          photos: $('gallery').querySelectorAll('img').length,
        };
      })()
    `, dom.getInternalVMContext())
    expect(result).toEqual({
      calls: [[123, 1], [123, 2]], canLoadMore: true, finished: true,
      status: '— end of photos —', months: ['2026-11', '2026-10'], photos: 2,
    })
    expect(dom.window.document.getElementById('jump')).toBeNull()
  } finally {
    dom.window.close()
  }
})
