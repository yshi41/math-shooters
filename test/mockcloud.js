/* In-memory stand-in for the save service (worker/src/index.js), so tests never touch the kids'
   real saves. attach(page) points the page at it and blocks every request to the real service. */
const MOCK = 'https://cloud.test';
const REAL = /math-shooters-saves\.[a-z0-9-]+\.workers\.dev/;
const clone = o => JSON.parse(JSON.stringify(o));
let logic = null;
async function load() { if (!logic) logic = await import('../worker/src/logic.mjs'); return logic; }

function create() {
  const store = {}, history = [], stats = { gets: 0, posts: 0, conflicts: 0, merges: 0, realHits: 0 }, ctl = { down: false };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  const json = (req, body, status = 200) => req.respond({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
  async function handle(req) {
    const url = req.url();
    if (REAL.test(url)) { stats.realHits++; return req.abort('blockedbyclient'); }
    if (!url.startsWith(MOCK)) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: cors });
    if (ctl.down) return req.abort('internetdisconnected');
    const { mergeState, lowersProgress, KIDS } = await load();
    const path = new URL(url).pathname;
    if (path === '/saves') { stats.gets++; const players = {}; KIDS.forEach(id => { if (store[id]) players[id] = clone(store[id]); }); return json(req, { players }); }
    const id = decodeURIComponent(path.split('/')[2] || ''), cur = store[id] || { rev: 0, state: null };
    if (req.method() === 'GET') { stats.gets++; return json(req, clone(cur)); }
    stats.posts++;
    const body = JSON.parse(req.postData() || '{}'), isObj = o => o && typeof o === 'object' && !Array.isArray(o);
    let state = body.state, merged = false;
    const conflict = () => { stats.conflicts++; return json(req, { conflict: true, ...clone(cur) }); };
    if (cur.rev !== body.rev) {
      if (!cur.state || !isObj(body.base)) return conflict();
      state = mergeState(state, clone(cur.state), body.base); merged = true; stats.merges++;
    }
    if (lowersProgress(state, cur.state)) return conflict();
    store[id] = { rev: cur.rev + 1, state: clone(state) }; history.push({ id, rev: cur.rev + 1, state: clone(state) });
    return json(req, merged ? { rev: cur.rev + 1, state, merged: true } : { rev: cur.rev + 1 });
  }
  async function attach(page) {
    await page.setRequestInterception(true);
    page.on('request', r => { handle(r).catch(() => { try { r.abort(); } catch (e) {} }); });
    await page.evaluateOnNewDocument(mock => { window.MS_CLOUD = mock; }, MOCK);
  }
  return { store, history, stats, ctl, attach, MOCK };
}
module.exports = { create, MOCK };
