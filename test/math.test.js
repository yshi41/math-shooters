/* The arithmetic generators: node math.test.js
   Lifts the MSMath block out of src/game.js so it is tested exactly as shipped. */
const assert = require('assert'), fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8');
const block = src.match(/\/\*@@MATH@@\*\/([\s\S]*?)\/\*@@END_MATH@@\*\//);
assert(block, 'the MSMath block is marked in src/game.js');
const M = new Function(block[1] + ';return MSMath')();
const evalQ = q => q.op === 'add' ? q.a + q.b : q.op === 'sub' ? q.a - q.b : q.op === 'div' ? q.a / q.b : q.a * q.b;
let n = 0;
const check = (ok, what) => { n++; if (!ok) throw new Error('FAIL ' + what); };

for (const cat of ['add', 'sub', 'tables', 'mul', 'div', 'mix']) for (const g of [3, 4]) for (const t of [1, 1.4, 2, 3.4, 5]) {
  const S = { q: null, missed: [] };
  for (let i = 0; i < 200; i++) {
    const q = M.problem(cat, g, t, S, {}); S.q = q;
    check(Number.isInteger(q.ans) && q.ans > 0 && q.ans <= 9999, `${cat} g${g} t${t}: answer in range (${q.text} = ${q.ans})`);
    check(evalQ(q) === q.ans, `${cat} g${g} t${t}: ${q.text} = ${q.ans}`);
    if (q.op === 'div') check(q.a % q.b === 0, 'division is exact');
    if (q.op === 'sub') check(q.ans > 0, 'subtraction stays positive');
    if (q.op === 'tables') { check(q.a <= 9 && q.b <= 9 && q.a >= 1, 'tables use 1..9'); check(/^\dx\d$/.test(q.key), 'tables key ' + q.key); if (t <= 1) check(Math.min(q.a, q.b) <= 3, 'tier 1 tables stay in the 1s to 3s'); }
    if (cat !== 'mix') check(q.op === cat || (cat === 'mul' && q.op === 'mul'), 'category ' + cat + ' gives ' + q.op);
    for (const k of [3, 4, 5]) { const c = M.choices(q, k); check(c.length === k && new Set(c).size === k && c.includes(q.ans) && c.every(v => Number.isInteger(v) && v > 0), `choices(${k}) distinct and include the answer (${c})`); }
  }
}
/* range spot checks */
for (let i = 0; i < 300; i++) { const q = M.problem('add', 3, 1); check(q.ans <= 40, 'grade 3 addition tier 1 sums stay at or under 40'); }
for (let i = 0; i < 300; i++) { const q = M.problem('mul', 4, 5); check(Math.max(q.a, q.b) >= 100, 'grade 4 multiplication tier 5 has a 3-digit factor'); }
/* a fractional tier gives both sizes */
let small = 0, big = 0; for (let i = 0; i < 400; i++) { const q = M.problem('add', 3, 1.4); if (q.ans <= 40) small++; else big++; }
check(small > 100 && big > 60, `tier 1.4 mixes tier 1 and tier 2 sizes (${small}/${big})`);
/* the weighted deck favours the facts this kid gets wrong */
const pool = M.tablePool(9); let hits = 0; for (let i = 0; i < 300; i++) { const d = M.deck({ '7x8': { r: 0, w: 5 } }, pool, 10); if (d.some(f => f.a === 7 && f.b === 8)) hits++; }
check(hits > 150, 'a fact with 5 wrongs is in most 10-card decks (' + hits + '/300)');
/* a missed problem comes back */
const S2 = { q: { key: 'x' }, missed: [{ op: 'add', a: 2, b: 3, ans: 5, key: 'add:2:3', text: '2 + 3', sym: '+' }] };
let back = 0; for (let i = 0; i < 50; i++) { S2.missed = [{ op: 'add', a: 2, b: 3, ans: 5, key: 'add:2:3', text: '2 + 3', sym: '+' }]; if (M.problem('add', 3, 1, S2, {}).key === 'add:2:3') back++; }
check(back > 15 && back < 45, 'missed problems are re-asked about 60% of the time (' + back + '/50)');
/* adapt */
check(M.adapt(20, 5, 2) === 20 && M.adapt(1, -5, 2) === 1, 'adapt clamps to 1..20');
check(M.adapt(5, .3, 3) > 5 && M.adapt(5, -.8, 3) < 5, 'adapt rises on right and falls on wrong');
check(M.adapt(2, .3, 8) > M.adapt(10, .3, 8) - 8, 'adapt climbs faster below the warm level');
console.log('math: ' + n + ' checks ok');
