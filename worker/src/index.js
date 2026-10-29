/* Math Shooters save service. One row per kid; a save only lands when it names the revision it was
   based on, saves from two devices are merged here, progress can never drop, and every accepted save is
   kept in a history table for recovery. Shares the D1 database with Spelling Worlds, in its own tables. */
import { mergeState, lowersProgress, KIDS } from './logic.mjs';

const ID_RE = /^(charlie|riley|yan|qa-[a-z0-9-]{1,32})$/;
const MAX_BYTES = 200000;
const KEEP_HISTORY = 300;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS ms_saves (player TEXT PRIMARY KEY, rev INTEGER NOT NULL, state TEXT NOT NULL, updated INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS ms_history (id INTEGER PRIMARY KEY AUTOINCREMENT, player TEXT NOT NULL, rev INTEGER NOT NULL, state TEXT NOT NULL, at INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS ms_history_player ON ms_history (player, id)'
];
let ready = null;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
/* the tables are also in schema.sql; creating them here means a fresh deploy works before anyone runs it */
async function ensure(db) {
  if (!ready) ready = (async () => { for (const s of SCHEMA) { try { await db.prepare(s).run(); } catch (e) { ready = null; throw e; } } })();
  return ready;
}
async function current(db, id) {
  const r = await db.prepare('SELECT rev, state FROM ms_saves WHERE player = ?').bind(id).first();
  return r ? { rev: r.rev, state: JSON.parse(r.state) } : { rev: 0, state: null };
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url), db = env.DB;
    if (url.pathname === '/') return new Response('Math Shooters save service', { headers: { ...CORS, 'Content-Type': 'text/plain' } });
    await ensure(db);
    if (url.pathname === '/saves' && req.method === 'GET') {
      const { results } = await db.prepare(`SELECT player, rev, state FROM ms_saves WHERE player IN (${KIDS.map(() => '?').join(', ')})`).bind(...KIDS).all();
      const players = {};
      for (const r of results) players[r.player] = { rev: r.rev, state: JSON.parse(r.state) };
      return json({ players });
    }
    const m = url.pathname.match(/^\/saves\/([^/]+)$/);
    if (!m || !ID_RE.test(m[1])) return json({ error: 'not_found' }, 404);
    const id = m[1];
    if (req.method === 'GET') return json(await current(db, id));
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const text = await req.text();
    if (text.length > MAX_BYTES) return json({ error: 'too_big' }, 413);
    let body;
    try { body = JSON.parse(text); } catch (e) { return json({ error: 'bad_json' }, 400); }
    const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
    let state = body && body.state;
    const rev = body && Number.isInteger(body.rev) ? body.rev : -1;
    if (!isObj(state) || rev < 0) return json({ error: 'bad_request' }, 400);

    const cur = await current(db, id);
    let merged = false;
    if (cur.rev !== rev) {
      /* another device saved first: lay this page's changes onto the stored copy */
      if (!cur.state || !isObj(body.base)) return json({ conflict: true, ...cur });
      state = mergeState(state, cur.state, body.base); merged = true;
    }
    if (lowersProgress(state, cur.state)) return json({ conflict: true, ...cur });
    const now = Date.now(), s = JSON.stringify(state);
    const res = cur.rev === 0
      ? await db.prepare('INSERT INTO ms_saves (player, rev, state, updated) VALUES (?, 1, ?, ?) ON CONFLICT(player) DO NOTHING').bind(id, s, now).run()
      : await db.prepare('UPDATE ms_saves SET rev = rev + 1, state = ?, updated = ? WHERE player = ? AND rev = ?').bind(s, now, id, cur.rev).run();
    if (!res.meta.changes) return json({ conflict: true, ...(await current(db, id)) });
    const next = cur.rev + 1;
    const writes = [db.prepare('INSERT INTO ms_history (player, rev, state, at) VALUES (?, ?, ?, ?)').bind(id, next, s, now)];
    if (next % 25 === 0) writes.push(db.prepare('DELETE FROM ms_history WHERE player = ? AND id NOT IN (SELECT id FROM ms_history WHERE player = ? ORDER BY id DESC LIMIT ?)').bind(id, id, KEEP_HISTORY));
    await db.batch(writes);
    return json(merged ? { rev: next, state, merged: true } : { rev: next });
  }
};
