/* Merge rules for Math Shooters saves, shared by the Worker and the test stand-in.
   A save carries the copy it started from (base). mergeState lays this page's changes since base onto the
   copy another device stored: counters move by the difference, records (stars, best scores) keep the higher
   value, perks and upgrade levels are kept from both, and settings follow this page. */
const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
const num = v => (typeof v === 'number' && isFinite(v)) ? v : 0;
const clone = o => JSON.parse(JSON.stringify(o));
const delta = (a, b) => num(a) - num(b);

export const KIDS = ['charlie', 'riley', 'yan'];

export function mergeState(mine, theirs, base) {
  mine = isObj(mine) ? mine : {}; theirs = isObj(theirs) ? theirs : {}; base = isObj(base) ? base : {};
  const out = clone(theirs);
  out.cur = Math.max(0, num(theirs.cur) + delta(mine.cur, base.cur));
  out.games = num(theirs.games) + Math.max(0, delta(mine.games, base.games));
  const tc = isObj(theirs.coop) ? theirs.coop : {}, mc = isObj(mine.coop) ? mine.coop : {}, bc = isObj(base.coop) ? base.coop : {};
  out.coop = { played: num(tc.played) + Math.max(0, delta(mc.played, bc.played)), wins: num(tc.wins) + Math.max(0, delta(mc.wins, bc.wins)) };
  for (const k of ['stars', 'best', 'ups']) {
    out[k] = Object.assign({}, isObj(theirs[k]) ? theirs[k] : {});
    const m = isObj(mine[k]) ? mine[k] : {};
    for (const key in m) out[k][key] = Math.max(num(out[k][key]), num(m[key]));
  }
  out.skill = Object.assign({}, isObj(theirs.skill) ? theirs.skill : {}, isObj(mine.skill) ? mine.skill : {});
  for (const k of ['facts', 'ops']) {
    out[k] = clone(isObj(theirs[k]) ? theirs[k] : {});
    const mf = isObj(mine[k]) ? mine[k] : {}, bf = isObj(base[k]) ? base[k] : {};
    for (const key in mf) {
      const m = isObj(mf[key]) ? mf[key] : {}, b = isObj(bf[key]) ? bf[key] : {}, t = isObj(out[k][key]) ? out[k][key] : (out[k][key] = { r: 0, w: 0 });
      t.r = num(t.r) + Math.max(0, delta(m.r, b.r)); t.w = num(t.w) + Math.max(0, delta(m.w, b.w));
    }
  }
  out.perks = [...new Set([...(Array.isArray(theirs.perks) ? theirs.perks : []), ...(Array.isArray(mine.perks) ? mine.perks : [])].filter(x => typeof x === 'string'))];
  if ('autoFire' in mine) out.autoFire = mine.autoFire;
  out.updated = Date.now();
  return out;
}

/* true when a save would throw away earned progress (stars, top scores, upgrade levels, bought perks) */
export function lowersProgress(next, cur) {
  if (!isObj(cur) || !isObj(next)) return false;
  for (const k of ['stars', 'best', 'ups']) {
    const c = isObj(cur[k]) ? cur[k] : {}, n = isObj(next[k]) ? next[k] : {};
    for (const key in c) if (num(n[key]) < num(c[key])) return true;
  }
  const perks = Array.isArray(next.perks) ? next.perks : [];
  for (const id of (Array.isArray(cur.perks) ? cur.perks : [])) if (!perks.includes(id)) return true;
  return false;
}
