/* Merge rules: node logic.test.js */
const assert = require('assert');
(async () => {
  const { mergeState, lowersProgress } = await import('../worker/src/logic.mjs');
  const base = { cur: 10, games: 1, stars: { 'add-1': 1 }, best: { 'add-1': 500 }, skill: { add: 3 }, facts: { '3x7': { r: 1, w: 1 } }, ops: { add: { r: 4, w: 1 } }, perks: [], coop: { played: 0, wins: 0 } };
  const mine = { cur: 25, games: 2, stars: { 'add-1': 2 }, best: { 'add-1': 900 }, skill: { add: 4 }, facts: { '3x7': { r: 3, w: 1 }, '4x7': { r: 1, w: 0 } }, ops: { add: { r: 9, w: 1 } }, perks: ['p_heart'], autoFire: false, coop: { played: 1, wins: 1 } };
  const theirs = { cur: 40, games: 3, stars: { 'add-1': 1, 'add-2': 3 }, best: { 'add-1': 700, 'add-2': 1000 }, skill: { add: 5, sub: 2 }, facts: { '3x7': { r: 2, w: 2 }, '8x8': { r: 1, w: 0 } }, ops: { add: { r: 6, w: 3 }, sub: { r: 1, w: 0 } }, perks: ['p_bomb'], autoFire: true, coop: { played: 2, wins: 0 } };
  const out = mergeState(mine, theirs, base);
  assert.strictEqual(out.cur, 55, 'treats move by the delta of this page');
  assert.strictEqual(out.games, 4);
  assert.deepStrictEqual(out.stars, { 'add-1': 2, 'add-2': 3 });
  assert.deepStrictEqual(out.best, { 'add-1': 900, 'add-2': 1000 });
  assert.deepStrictEqual(out.skill, { add: 4, sub: 2 });
  assert.deepStrictEqual(out.facts, { '3x7': { r: 4, w: 2 }, '4x7': { r: 1, w: 0 }, '8x8': { r: 1, w: 0 } });
  assert.deepStrictEqual(out.ops, { add: { r: 11, w: 3 }, sub: { r: 1, w: 0 } });
  assert.deepStrictEqual(out.perks.sort(), ['p_bomb', 'p_heart']);
  assert.strictEqual(out.autoFire, false);
  assert.deepStrictEqual(out.coop, { played: 3, wins: 1 });
  /* a purchase on this page (cur down, perks up) survives a merge */
  const bought = mergeState({ cur: 0, perks: ['p_slow'] }, { cur: 90, perks: [] }, { cur: 40, perks: [] });
  assert.strictEqual(bought.cur, 50); assert.deepStrictEqual(bought.perks, ['p_slow']);
  /* a first save from a fresh page merges onto an existing copy without losing either */
  const first = mergeState({ cur: 12, stars: { 'sub-1': 1 } }, { cur: 30, stars: { 'add-3': 2 } }, {});
  assert.strictEqual(first.cur, 42); assert.deepStrictEqual(first.stars, { 'sub-1': 1, 'add-3': 2 });
  /* progress can never drop */
  assert.strictEqual(lowersProgress({ stars: { 'add-1': 1 } }, { stars: { 'add-1': 2 } }), true);
  assert.strictEqual(lowersProgress({ stars: { 'add-1': 2 }, perks: [] }, { stars: { 'add-1': 2 }, perks: ['p_heart'] }), true);
  assert.strictEqual(lowersProgress({ stars: { 'add-1': 2 }, cur: 0, perks: ['p_heart'] }, { stars: { 'add-1': 2 }, cur: 500, perks: ['p_heart'] }), false, 'spending treats is allowed');
  assert.strictEqual(lowersProgress(out, theirs), false);
  console.log('logic: 17 checks ok');
})().catch(e => { console.error(e); process.exit(1); });
