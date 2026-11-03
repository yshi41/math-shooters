/* Headless Chrome checks: node test.js ../index.html
   Every run talks to the in-memory stand-in in mockcloud.js, never to the real save service. */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const { create } = require('./mockcloud.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const file = path.resolve(process.argv[2] || '../index.html');
const F = 'file:///' + file.replace(/\\/g, '/');
const wait = ms => new Promise(r => setTimeout(r, ms));
let n = 0, failed = 0;
const check = (ok, what) => { n++; if (!ok) { failed++; console.log('  FAIL', what); } };
const until = async (fn, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(100); } return false; };
/* Riley's stored save starts with auto-fire off so the quiet/held-key checks mean something; the default for a fresh save is on */
const riley0 = () => ({ cur: 100, games: 1, stars: { 'add-1': 2, 'add-2': 1 }, best: { 'add-1': 900 }, skill: {}, facts: {}, ops: {}, perks: ['p_heart'], autoFire: false, coop: { played: 0, wins: 0 } });

/* what the drive loop sees each tick */
const snap = p => p.evaluate(() => { const G = window.__ms.G; if (!G) return null; const cv = document.querySelector('#cv');
  return { phase: G.phase, wave: G.wave, correct: G.correct, wrongs: G.wrongs, W: cv.clientWidth, H: cv.clientHeight, qOpen: G.qOpen, offer: G.offer, taken: G.taken,
    players: G.players.map(q => ({ x: q.x, y: q.y, hearts: q.hearts, bombs: q.bombs, lv: Object.values(q.up).reduce((a, b) => a + b, 0), charge: q.charge, laser: q.laser, down: q.down, out: q.out, firing: q.firing, up: q.up })),
    bubbles: G.bubbles.filter(b => b.state === 'live').map(b => ({ x: b.x, y: b.y, ok: b.ok })),
    enemies: G.enemies.filter(e => !e.flee).map(e => ({ x: e.x, y: e.y })), eshots: G.eshots.map(s => ({ x: s.x, y: s.y })), bullets: G.bullets.length }; });
/* steer player pi toward (tx,ty): avoid wrong bubbles on the way and enemies nearby; the bot holds fire the whole time (there is no auto-fire) */
async function steer(p, pi, s, tx, ty, raw) {
  const me = s.players[pi], H = s.H; let dx = tx - me.x, dy = ty - me.y;
  const threat = raw ? null : s.enemies.concat(s.eshots).find(e => Math.abs(e.x - me.x) < 70 && e.y > H * .4 && e.y < me.y + 40);
  if (threat) { dx = threat.x > me.x ? -200 : 200; dy = 0; }
  else if (!raw && Math.abs(dx) > 6) {
    /* a wrong bubble between here and there at our height: slip under or over it first */
    const lo = Math.min(me.x, tx) - 50, hi = Math.max(me.x, tx) + 50;
    const blockers = s.bubbles.filter(b => !b.ok && b.x > lo && b.x < hi && Math.abs(b.y - me.y) < 90);
    if (blockers.length) { const b = blockers[0]; dy = b.y > me.y ? -200 : 200; dx = 0; }
  }
  await p.evaluate((i, h) => window.__ms.input(i, h), pi, { left: dx < -6, right: dx > 6, up: dy < -6, down: dy > 6, fire: true });
}
const stop = (p, pi) => p.evaluate(i => window.__ms.input(i, { left: false, right: false, up: false, down: false, fire: true }), pi);

(async () => {
  const html = fs.readFileSync(file, 'utf8');
  check(!/localStorage|sessionStorage|indexedDB/.test(html), 'the page never mentions browser storage');
  check(/MS_CLOUD/.test(html), 'the page names the save service');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-gpu'] });
  const errs = [];
  const newPage = async (mock, viewport) => {
    const p = await browser.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.setViewport(viewport || { width: 1000, height: 820 });
    await mock.attach(p);
    await p.evaluateOnNewDocument(() => { window.__storageWrites = 0; for (const k of ['localStorage', 'sessionStorage']) { try { const s = window[k], set = s.setItem.bind(s); s.setItem = (...a) => { window.__storageWrites++; return set(...a); }; } catch (e) {} } });
    await p.goto(F); return p;
  };

  /* 1. loading: the player screen waits for the saves, the hub and map show the stored progress */
  const mock = create();
  mock.store.riley = { rev: 3, state: riley0() };
  let p = await newPage(mock);
  await until(() => p.evaluate(() => !document.querySelector('.profile-card').disabled));
  check(mock.stats.gets === 1, 'one GET loads every save');
  /* the claude.ai db hands back frozen snapshots; the end of a world writes into the save, which crashed once (10/29) */
  check(await p.evaluate(() => { const fz = o => { if (o && typeof o === 'object') { Object.values(o).forEach(fz); Object.freeze(o); } return o; };
    try { const s = window.__ms.normalize(fz({ cur: 1, stars: { 'add-1': 1 }, best: { 'add-1': 5 }, skill: { add: 2 }, facts: { '2x3': { r: 1, w: 0 } }, ops: { add: { r: 1, w: 0 } }, perks: [], coop: { played: 0, wins: 0 } }));
      s.stars['add-2'] = 3; s.best['add-1'] = 9; s.skill.add = 4; s.ops.add.r++; s.facts['2x3'].w++; s.coop.played++; return s.ops.add.r === 2 && s.stars['add-2'] === 3; } catch (e) { return false; } }), 'a frozen save from the db comes back writable'); check(mock.stats.realHits === 0, 'the real service is never called');
  check(await p.evaluate(() => { const s = window.__ms.normalize({ medals: { 'add-1/p': 1 }, ups: { plasma: 1, drone: 2, long: 2, battery: 1, bogus: 3 }, autoFire: false }), d = window.__ms.normalize({});
    return s.medals['add-1/p'] === 1 && s.ups.plasma === 1 && s.ups.drone === 2 && s.ups.long === 2 && s.ups.battery === 1 && !('bogus' in s.ups) && s.autoFire === false && d.autoFire === true; }), 'normalize keeps medals, the new upgrade ids and the auto-fire setting (default on)');
  check(await p.evaluate(() => document.querySelector('[data-kid=riley]').textContent.includes('100')), 'Riley shows her 100 treats');
  await p.click('[data-kid=riley]'); await wait(200);
  check(await p.evaluate(() => document.querySelector('[data-perk=p_heart] button').textContent === 'Owned'), 'the store shows Heart Locket as owned');
  check(await p.evaluate(() => !document.querySelector('#coopBtn').hidden), 'a computer gets the Play together button');
  await p.click('#playBtn'); await wait(200);
  check(await p.evaluate(() => !document.querySelector('[data-w="add-3"]').disabled && document.querySelector('[data-w="add-4"]').disabled && document.querySelector('[data-w="sub-1"]').disabled), 'the map opens add-3 and locks add-4 and sub-1');
  check(await p.evaluate(() => document.querySelectorAll('[data-w="add-1"] .st.on').length === 2), 'add-1 shows its two stars');

  /* 2. a solo world (Addition 3): left Ctrl shoots, left Shift fires the laser, upgrades stay through a wrong catch and are saved; another device saves meanwhile */
  await p.click('[data-w="add-3"]'); await wait(300);
  /* every enemy shoots back now; extra hearts keep the bot alive long enough to check the save path */
  await p.evaluate(() => { for (const q of window.__ms.G.players) { q.maxHearts = q.hearts = 20; } });
  mock.store.riley = { rev: 4, state: Object.assign(riley0(), { cur: 150, stars: { 'add-1': 2, 'add-2': 1, 'sub-1': 1 } }) };
  await until(() => p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 6000);
  await p.evaluate(() => window.__ms.input(0, { fire: false })); await wait(500);
  const quiet = (await snap(p)).bullets;
  await p.keyboard.down('ControlLeft'); await wait(400);
  const ctrlShots = (await snap(p)).bullets; await p.keyboard.up('ControlLeft'); await wait(100);
  check(quiet === 0 && ctrlShots > 0, 'with auto-fire off nothing fires on its own and left Ctrl shoots (' + quiet + ' then ' + ctrlShots + ')');
  await p.evaluate(() => { window.__ms.G.bullets = []; window.__ms.G.players[0].auto = true; }); await wait(400);
  const autoShots = (await snap(p)).bullets; await p.evaluate(() => { window.__ms.G.players[0].auto = false; });
  check(autoShots > 0, 'with auto-fire on the ship shoots with no key held (' + autoShots + ')');
  check((await snap(p)).players[0].charge === 1, 'the laser starts charged');
  await p.keyboard.press('ShiftLeft'); await wait(100);
  let ls = (await snap(p)).players[0];
  check(ls.laser > 0 && ls.charge === 0, 'left Shift fires the laser and empties the charge');
  await wait(2200);
  await p.keyboard.press('ShiftLeft'); await wait(100);
  ls = (await snap(p)).players[0];
  check(ls.laser <= 0 && ls.charge > 0 && ls.charge < 1, 'the laser stops after two seconds and has to charge again (' + ls.charge.toFixed(2) + ')');
  let picked = 0, wrongDone = false, wrongCheck = null, wrapSeen = false, lastBubbleY = null, prev = null;
  for (let i = 0; i < 3000; i++) {
    const s = await snap(p); if (!s) break;
    if (s.phase === 'upgrade') { if (picked < s.wave) { picked = s.wave;
        /* take a real upgrade (not a filler) so the saved levels can be checked */
        const idx = await p.evaluate(() => [...document.querySelectorAll('#upCards .up-card')].findIndex(b => !['heal', 'treats'].includes(b.dataset.up)));
        await p.keyboard.press(String((idx < 0 ? 0 : idx) + 1)); await wait(150); } continue; }
    if (s.phase !== 'run') { await stop(p, 0); await wait(80); continue; }
    const me = s.players[0], ok = s.bubbles.find(b => b.ok), wrong = s.bubbles.find(b => !b.ok);
    if (ok) { if (lastBubbleY != null && ok.y < lastBubbleY - s.H * .5) wrapSeen = true; lastBubbleY = ok.y; }
    const zoneY = y => Math.max(s.H * .56, Math.min(y, s.H - 40));
    if (prev && !wrongDone && s.wrongs > prev.wrongs) { wrongDone = true; wrongCheck = { hearts: me.hearts < prev.hearts, kept: me.lv === prev.lv, lv: me.lv, wave: s.wave }; }
    if (s.wave >= 2 && !wrongDone && wrong) await steer(p, 0, s, wrong.x, zoneY(wrong.y), true);
    else if (ok) await steer(p, 0, s, ok.x, zoneY(ok.y));
    else await stop(p, 0);
    prev = { hearts: me.hearts, lv: me.lv, wrongs: s.wrongs };
    await wait(50);
  }
  check(picked === 2, 'an upgrade was picked after waves 1 and 2 (' + picked + ')');
  check(wrongDone && wrongCheck.hearts && wrongCheck.kept, 'a wrong catch cost a heart but no upgrade ' + JSON.stringify(wrongCheck));
  check(wrapSeen, 'a missed bubble came back around at the top');
  check(await until(() => p.evaluate(() => !document.querySelector('#results').hidden), 5000), 'the world ended on the results screen');
  const won = await p.evaluate(() => document.querySelector('#resTitle').textContent.includes('clear') || document.querySelector('#resTitle').textContent.includes('Perfect'));
  check(won, 'the world was cleared (' + await p.evaluate(() => document.querySelector('#resTitle').textContent) + ')');
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  const r = mock.store.riley.state;
  const savedLv = Object.values(r.ups || {}).reduce((x, y) => x + y, 0);
  check(savedLv >= 2, 'the picked upgrades were saved (' + JSON.stringify(r.ups) + ')');
  check(mock.store.riley.rev === 5, 'the save landed on top of the other device (rev ' + mock.store.riley.rev + ')');
  check(mock.stats.merges === 1, 'the service merged it');
  check((r.stars['add-3'] | 0) >= 1 && r.stars['sub-1'] === 1 && r.stars['add-1'] === 2, 'stars kept from both copies (' + JSON.stringify(r.stars) + ')');
  check(r.cur > 150, 'treats were added to the other device total (' + r.cur + ')');
  check(r.ops.add && r.ops.add.w >= 1 && r.ops.add.r >= 10, 'the answer log reached the save (' + JSON.stringify(r.ops) + ')');
  check(r.medals && typeof r.medals === 'object' && !r.medals['add-3/p'] && r.autoFire === false, 'medals are in the save, no Perfect after a wrong catch, auto-fire setting kept (' + JSON.stringify(r.medals) + ')');
  check(r.missions && r.missions.active.length === 3 && ((r.missions.active.find(m => m.id === 'catch25') || {}).n | 0) >= 10, 'three missions in the save and the catch mission advanced (' + JSON.stringify(r.missions) + ')');
  check(await p.evaluate(() => window.__storageWrites) === 0, 'nothing was written to browser storage');
  check(await p.evaluate(() => { try { return localStorage.length === 0 && sessionStorage.length === 0; } catch (e) { return true; } }), 'browser storage is empty');
  check(await p.evaluate(() => !document.querySelector('#nextBtn').hidden), 'Next world is offered after a clear');

  /* 3. the store: a perk bought now applies to the next world */
  await p.click('#mapBtn'); await wait(200); await p.click('#mapBack'); await wait(200);
  check(await p.evaluate(() => document.querySelectorAll('#missions .mission').length === 3 && /\d+ \/ 25/.test(document.querySelector('[data-mission=catch25]').textContent)), 'the hub shows three missions with progress');
  await p.click('#tAuto'); await wait(200);
  check(await p.evaluate(() => window.__ms.P().autoFire === true && document.querySelector('#tAuto').getAttribute('aria-pressed') === 'true'), 'the hub Auto-fire toggle turns it on');
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  check(mock.store.riley.state.autoFire === true, 'auto-fire is saved with the profile');
  await p.click('#tAuto'); await wait(200);
  await p.click('[data-perk=p_bomb] button'); await wait(300);
  check(await p.evaluate(() => window.__ms.P().perks.includes('p_bomb')), 'Spare Bomb was bought');
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  check(mock.store.riley.state.perks.includes('p_bomb') && mock.store.riley.state.perks.includes('p_heart') && mock.stats.conflicts === 0, 'the purchase reached the save without a conflict');
  await p.evaluate(() => window.__ms.startWorld(0, 1)); await wait(300);
  let s = await snap(p);
  check(s && s.players[0].bombs >= 2 && s.players[0].hearts >= 6, 'the next world starts with the perks: 2+ bombs and 6+ hearts');
  check(s && s.players[0].lv === savedLv, 'the next world starts with the saved upgrades (' + s.players[0].lv + ' of ' + savedLv + ' levels)');
  /* the Math Hydra: its armor holds until the right arm is shot off, a wrong arm grows back, the body takes hits while open */
  await until(() => p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 6000);
  const hy = await p.evaluate(async () => { const ms = window.__ms, G = ms.G, sl = t => new Promise(r => setTimeout(r, t));
    for (const q of G.players) { q.maxHearts = q.hearts = 20; } G.correct = -50; /* keep the wave from clearing mid-check */
    const e = ms.spawnHydra(); e.y = e.home; await sl(150);
    const shot = (x, y) => ms.hydraHit(e, { x, y, dmg: 1 });
    const out = { arms: e.arms.length, oneRight: e.arms.filter(m => m.ok).length === 1 && e.arms.some(m => m.ok && m.v === e.q.ans), chip: document.querySelector('#eq2').textContent.includes(e.q.text) };
    const hp0 = e.hp; shot(e.x, e.y); out.armored = e.hp === hp0 && !(e.open > 0);
    const wrong = e.arms.find(m => !m.ok), wv = wrong.v; shot(wrong.x, wrong.y); out.wrongGone = wrong.state === 'grow' && !(e.open > 0) && e.hp === hp0;
    await sl(1300); out.wrongBack = wrong.state === 'on' && wrong.v === wv;
    const right = e.arms.find(m => m.ok), q0 = e.q; shot(right.x, right.y); out.open = e.open > 0 && right.state === 'gone';
    shot(e.x, e.y); out.bodyHit = e.hp === hp0 - 1;
    await sl(6000); out.regrown = !(e.open > 0) && e.arms.every(m => m.state === 'on') && e.arms.filter(m => m.ok).length === 1 && e.q !== q0 && e.arms.some(m => m.ok && m.v === e.q.ans);
    for (let k = 0; k < 60 && !e.dead; k++) { const r = e.arms.find(m => m.ok); if (r.state === 'on') shot(r.x, r.y); shot(e.x, e.y); await sl(30); }
    await sl(150); out.killed = e.dead === true && !G.enemies.includes(e);
    return out; });
  check(hy.arms === 3 && hy.oneRight && hy.chip, 'a hydra spawns with 3 arms, one right answer, and its problem in the HUD chip ' + JSON.stringify(hy));
  check(hy.armored, 'the hydra body is armored before the right arm is shot');
  check(hy.wrongGone && hy.wrongBack, 'a wrong arm comes off and grows back with the same number');
  check(hy.open && hy.bodyHit, 'shooting the right arm opens the body and the body takes damage');
  check(hy.regrown, 'the arm grows back with a new problem');
  check(hy.killed, 'enough body damage kills the hydra');
  /* capsule power-ups (hold fire and auto-fire off so stray bullets do not touch the test enemies) */
  const pw = await p.evaluate(async () => { const ms = window.__ms, G = ms.G, sl = t => new Promise(r => setTimeout(r, t)), me = G.players[0], out = {};
    me.auto = false; ms.input(0, { fire: false }); G.bullets = [];
    G.qOpen = false;  /* no catches while we watch the bubbles; the same bubbles are compared before and after */
    const live = () => G.bubbles.filter(b => b.state === 'live' && b.y > 0);
    for (let k = 0; k < 40 && live().length < 2; k++) await sl(100);
    const L = live(), y0 = L.map(b => b.y); ms.givePower(0, 'freeze'); await sl(400);
    out.frozen = G.pw.freeze > 0 && L.length > 0 && L.every((b, i) => Math.abs(b.y - y0[i]) < .5);
    G.pw.freeze = 0; await sl(300); out.thawed = L.some((b, i) => b.y > y0[i] + 5 || b.y < y0[i] - 100); G.qOpen = true;
    ms.givePower(0, 'x2'); out.x2 = ms.scoreMul() === 2; G.glowT = 5; out.x4 = ms.scoreMul() === 4; G.glowT = 0; G.pw.x2 = 0;
    ms.givePower(0, 'over'); me.auto = true; me.fireT = 0; await sl(150); me.auto = false; out.over = me.pw.over > 0 && G.bullets.some(b => b.pierce === 1); me.pw.over = 0; G.bullets = [];
    ms.givePower(0, 'wing'); out.wing = ms.drones(0) === 1; me.auto = true; await sl(400); out.droneFires = G.bullets.some(b => b.drone);
    me.auto = false; G.bullets = []; await sl(400); out.droneHolds = !G.bullets.some(b => b.drone); me.pw.wing = 0;
    me.up.shield = 0; me.shieldOn = false; ms.givePower(0, 'shield'); const h0 = me.hearts; out.shieldOn = me.shieldOn; me.inv = 0; ms.hitPlayer(0); out.shieldHeld = me.hearts === h0 && !me.shieldOn; me.inv = 0;
    me.charge = .2; ms.givePower(0, 'cell'); out.cell = me.charge >= .69;
    me.bombs = 0; me.maxBombs = 2; ms.givePower(0, 'bomb'); out.bomb = me.bombs === 1;
    out.caps = G.stats.caps; return out; });
  check(pw.frozen && pw.thawed, 'Freeze stops the bubbles and they fall again after ' + JSON.stringify(pw));
  check(pw.x2 && pw.x4, 'Double Points gives ×2 and ×4 with Glow Mode');
  check(pw.over, 'Overdrive makes piercing bullets');
  check(pw.wing && pw.droneFires && pw.droneHolds, 'Wingman adds a drone that shoots only while the ship fires');
  check(pw.shieldOn && pw.shieldHeld, 'a Shield capsule works without the upgrade and absorbs one hit');
  check(pw.cell && pw.bomb && pw.caps === 7, 'Laser Cell and Bomb capsules apply, 7 power-ups counted (' + pw.caps + ')');
  /* the Bubble Snatcher, asteroids, a swarm, an astronaut and the Mothership */
  const en = await p.evaluate(async () => { const ms = window.__ms, G = ms.G, sl = t => new Promise(r => setTimeout(r, t)), me = G.players[0], out = {}, cv = document.querySelector('#cv'), W = cv.clientWidth, H = cv.clientHeight;
    const sn = ms.spawnSnatcher(); sn.x = W / 2; sn.y = 60;
    let held = null; for (let k = 0; k < 70 && !held; k++) { await sl(100); held = G.bubbles.find(b => b.state === 'held'); }
    out.held = !!held && held.by === sn && sn.mode === 'flee';
    ms.damage(sn, 5); await sl(60); out.freed = !!held && held.state === 'live' && !held.by && sn.dead === true && G.stats.snatchers === 1;
    const big = ms.spawnRock(); big.x = W / 2; big.y = H * .4; big.vx = 0; big.vy = 0;
    ms.damage(big, 3); await sl(60); const smalls = G.enemies.filter(o => o.kind === 'rock' && !o.big); out.split = big.dead === true && smalls.length >= 2;
    const s = smalls[0]; const h0 = me.hearts; me.inv = 0; s.x = me.x; s.y = me.y; s.vx = 0; s.vy = 0; await sl(120); out.bump = me.hearts === h0 - 1 && s.hp <= 0;
    for (const o of G.enemies) if (o.kind === 'rock') o.hp = 0; await sl(60);
    const id = ms.spawnSwarm(); const bees = G.enemies.filter(o => o.kind === 'bee' && o.swarm === id); out.bees = bees.length === 5;
    const sc0 = G.score, c0 = G.pickups.filter(k => k.kind === 'cap').length; G.chain = 0; G.lastCm = 1; G.streak = 0;
    for (const b of bees) ms.damage(b, 1); await sl(60);
    out.chain = G.chain === 5 && ms.chainMul() === 2; out.swarmBonus = G.score - sc0 >= 520 && G.pickups.filter(k => k.kind === 'cap').length >= c0 + 1; out.gain = G.score - sc0;
    const a = ms.spawnAstro(); a.x = me.x; a.y = me.y; await sl(120); out.rescued = G.stats.rescues === 1 && !G.pickups.includes(a);
    const b = ms.spawnBoss(); b.y = b.home; await sl(120); const hp0 = b.hp, hit = (x, y, d) => ms.bossHit(b, { x, y, dmg: d });
    hit(b.x, b.y, 2); out.armored = b.hp === hp0 && !b.open;
    for (const t of b.turrets) hit(t.x, t.y, 20); await sl(120); out.open = b.open === true && b.turrets.every(t => t.hp <= 0);
    hit(b.x, b.y, 2); out.coreHit = b.hp === hp0 - 2;
    hit(b.x, b.y, 500); await sl(120); out.dead = b.dead === true && !G.enemies.includes(b);
    return out; });
  check(en.held && en.freed, 'the Snatcher grabs a bubble and drops it when shot ' + JSON.stringify(en));
  check(en.split && en.bump, 'a big asteroid splits in two and a small one costs a heart on contact');
  check(en.bees && en.chain && en.swarmBonus, 'five bees, a ×2 chain, and the full-swarm bonus with a capsule (+' + en.gain + ')');
  check(en.rescued, 'flying over an astronaut rescues it');
  check(en.armored && en.open && en.coreHit && en.dead, 'the Mothership is armored until both turrets die, then the core takes hits and it goes down');
  /* the Bonus Blitz, then an evolution card */
  const bz = await p.evaluate(async () => { const ms = window.__ms, G = ms.G, sl = t => new Promise(r => setTimeout(r, t)), me = G.players[0], out = {};
    ms.startBlitz(); out.phase = G.phase === 'blitz'; await sl(1200);
    out.bees = G.enemies.filter(e => e.blitz).length >= 8; await sl(1000); out.quiet = G.eshots.length === 0;
    const h0 = me.hearts; me.inv = 0; ms.hitPlayer(0); out.safe = me.hearts === h0;
    G.pickups = []; let killed = 0;  /* older capsules may still be falling off-screen; count only what the Blitz drops */
    for (let k = 0; k < 150 && G.phase === 'blitz'; k++) { for (const e of G.enemies) if (e.blitz && !e.flee && e.hp > 0 && !e.dead) { ms.damage(e, 1); killed++; } await sl(100); }
    out.killed = killed; out.perfect = G.stats.blitzPerfect === 1 && G.stats.blitzKills === 16; out.blitzKills = G.stats.blitzKills;
    out.cap = G.pickups.some(k => k.kind === 'cap');
    for (let k = 0; k < 80 && G.phase !== 'run'; k++) await sl(100); out.wave = G.wave; return out; });
  check(bz.phase && bz.bees && bz.quiet && bz.safe, 'the Blitz spawns bees that never fire and nothing hurts ' + JSON.stringify(bz));
  check(bz.perfect && bz.cap, 'shooting all 16 in the Blitz is a perfect with a capsule ' + JSON.stringify(bz));
  check(bz.wave === 2, 'after the Blitz, wave 2 begins (' + bz.wave + ')');
  const ev = await p.evaluate(async () => { const ms = window.__ms, G = ms.G, sl = t => new Promise(r => setTimeout(r, t)), me = G.players[0], out = {};
    for (let k = 0; k < 60 && G.phase !== 'run'; k++) await sl(100);
    for (let k = (me.up.rapid | 0); k < 3; k++) ms.applyUp(0, 'rapid'); for (let k = (me.up.power | 0); k < 2; k++) ms.applyUp(0, 'power');
    ms.openUpgrade(); out.first = G.offer[0] === 'plasma'; out.gold = !!document.querySelector('#upCards .up-card.evo'); out.n = G.offer.length;
    ms.pickUp(0); out.plasma = me.up.plasma === 1; await sl(60); out.phase = G.phase; return out; });
  check(ev.first && ev.gold && ev.plasma && ev.n === 3, 'maxed Rapid Fire + Power Shot offers the Plasma Cannon evolution first and it can be taken ' + JSON.stringify(ev));
  await p.keyboard.press('p'); await wait(150);
  check(await p.evaluate(() => !document.querySelector('#pauseMenu').hidden && window.__ms.G.paused), 'P pauses');
  await p.click('#quitBtn'); await wait(300);
  check(await p.evaluate(() => !document.querySelector('#results').hidden), 'quitting from pause ends on the results screen');
  /* Endless: opens after any world 3; mixed problems, its own ramp, a boss every 4th wave, no stars, the best wave saved */
  await p.click('#mapBtn'); await wait(200); await p.click('#mapBack'); await wait(200);
  check(await p.evaluate(() => !document.querySelector('#endlessBtn').hidden), 'Endless is offered once a world 3 is cleared');
  await p.click('#endlessBtn'); await wait(300);
  await until(() => p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 6000);
  const el = await p.evaluate(() => { const ms = window.__ms, G = ms.G, out = { endless: G.endless === true, waves: G.waves, label: document.querySelector('#stageLbl').textContent };
    G.wave = 4; out.boss4 = ms.bossWave(); G.wave = 3; out.boss3 = ms.bossWave(); G.wave = 4; ms.nextWave(); out.wave5 = G.wave === 5 && G.wi === 5 && G.ramp.speed > 112; return out; });
  check(el.endless && el.waves === 99 && /Endless/.test(el.label) && el.boss4 && !el.boss3 && el.wave5, 'Endless runs with its own ramp and a boss every 4th wave ' + JSON.stringify(el));
  await p.keyboard.press('p'); await wait(150); await p.click('#quitBtn'); await wait(300);
  check(await p.evaluate(() => /Wave 5 reached/.test(document.querySelector('#resTitle').textContent) && document.querySelector('#nextBtn').hidden), 'Endless ends with the wave reached and no Next world');
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  check(mock.store.riley.state.best['endless-wave'] === 5 && !('endless' in mock.store.riley.state.stars), 'the best Endless wave is saved, with no star');

  /* 4. two players on one keyboard: separate ships, a rescue, and four cards to share */
  await p.click('#mapBtn'); await wait(200);
  check(await p.evaluate(() => { const ms = window.__ms, st = document.querySelector('#stage'); ms.startWorld(0, 1); const a = st.style.background; ms.startWorld(1, 1); const b = st.style.background; return a.length > 0 && a !== b; }), 'each sector has its own backdrop');
  await p.evaluate(() => { window.__ms.setCoop(['riley', 'charlie']); window.__ms.startWorld(0, 1); }); await wait(300);
  await until(() => p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 6000);
  s = await snap(p);
  check(s && s.players.length === 2, 'two ships are in play');
  const y0 = s.players.map(q => q.y);
  await p.keyboard.down('w'); await wait(250); await p.keyboard.up('w');
  await p.keyboard.down('ArrowUp'); await wait(250); await p.keyboard.up('ArrowUp');
  s = await snap(p);
  check(s.players[0].y < y0[0] - 20 && s.players[1].y < y0[1] - 20, 'W moves player 1 and the up arrow moves player 2');
  /* player 1 catches wrong answers until down; player 2 stays out of the way */
  let downSeen = false;
  for (let i = 0; i < 1500 && !downSeen; i++) {
    s = await snap(p); if (!s) break;
    if (s.phase !== 'run') { await wait(80); continue; }
    const wrong = s.bubbles.find(b => !b.ok);
    if (wrong) await steer(p, 0, s, wrong.x, Math.max(s.H * .56, Math.min(wrong.y, s.H - 40)), true); else await stop(p, 0);
    await p.evaluate(() => window.__ms.input(1, { left: false, right: false, up: false, down: true, fire: true }));
    if (s.players[0].down) downSeen = true;
    await wait(50);
  }
  await stop(p, 0);
  check(downSeen, 'player 1 went down after catching wrong answers');
  check(await p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 'the run goes on while a partner is still up');
  let revived = false;
  for (let i = 0; i < 400 && !revived; i++) {
    s = await snap(p); if (!s) break;
    const a = s.players[0], b = s.players[1];
    await p.evaluate((h) => window.__ms.input(1, h), { left: a.x < b.x - 6, right: a.x > b.x + 6, up: a.y < b.y - 6, down: a.y > b.y + 6, fire: true });
    if (!a.down && !a.out && a.hearts === 2) revived = true;
    await wait(50);
  }
  await stop(p, 1);
  check(revived, 'player 2 flew into the rescue bubble and revived player 1 with 2 hearts');
  /* player 2 catches the right answers to the end of the wave; both pick a card */
  let cards = 0, picks = 0;
  for (let i = 0; i < 2500; i++) {
    s = await snap(p); if (!s) break;
    if (s.phase === 'upgrade') { cards = await p.evaluate(() => document.querySelectorAll('#upCards .up-card').length); await p.keyboard.press('1'); await wait(150); picks++; await p.keyboard.press('2'); await wait(150); picks++; break; }
    if (s.phase !== 'run') { await wait(80); continue; }
    const ok = s.bubbles.find(b => b.ok);
    if (ok) await steer(p, 1, s, ok.x, Math.max(s.H * .56, Math.min(ok.y, s.H - 40))); else await stop(p, 1);
    await p.evaluate(() => window.__ms.input(0, { left: false, right: false, up: false, down: true, fire: true }));
    await wait(50);
  }
  await stop(p, 1);
  check(cards === 4, 'together, the pick offers 4 cards (' + cards + ')');
  s = await snap(p);
  check(s && s.wave === 2 && Object.keys(s.players[0].up).length >= 1 && Object.keys(s.players[1].up).length >= 1, 'each player took one upgrade and wave 2 began');
  await p.keyboard.press('p'); await wait(150); await p.click('#quitBtn'); await wait(300);
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  check(mock.store.riley.state.coop.played === 1 && mock.store.charlie && mock.store.charlie.state.coop.played === 1 && mock.store.charlie.state.cur > 0, 'both kids saved the shared world and earned treats');
  await p.close();

  /* 5. a fresh page shows the merged stars; a page that cannot reach the service waits */
  p = await newPage(mock);
  await until(() => p.evaluate(() => !document.querySelector('.profile-card').disabled));
  await p.click('[data-kid=riley]'); await wait(200); await p.click('#playBtn'); await wait(200);
  check(await p.evaluate(() => document.querySelectorAll('[data-w="sub-1"] .st.on').length === 1 && !document.querySelector('[data-w="add-4"]').disabled), 'a fresh page shows the merged star on sub-1 and add-4 is open');
  await p.close();
  const down = create(); down.ctl.down = true;
  p = await newPage(down); await wait(1500);
  check(await p.evaluate(() => document.querySelector('.profile-card').disabled && !document.querySelector('#saveRetry').hidden), 'with the service down the player screen waits and offers Try again');
  down.ctl.down = false; await p.click('#saveRetry');
  check(await until(() => p.evaluate(() => !document.querySelector('.profile-card').disabled), 8000), 'Try again loads the saves');
  await p.close();

  /* 6. a phone: one thumb, no sideways scroll, finger-sized pad */
  const mob = create(); mob.store.riley = { rev: 1, state: riley0() };
  p = await newPage(mob, { width: 390, height: 800, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await until(() => p.evaluate(() => !document.querySelector('.profile-card').disabled));
  const wide = async () => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!(await wide()), 'no sideways scroll on the player screen');
  await p.tap('[data-kid=riley]'); await wait(200);
  check(!(await wide()), 'no sideways scroll on the hub');
  check(await p.evaluate(() => document.querySelector('#coopBtn').hidden), 'a phone hides Play together');
  await p.tap('#playBtn'); await wait(200);
  check(!(await wide()), 'no sideways scroll on the map');
  await p.tap('[data-w="add-1"]'); await wait(300);
  await until(() => p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 6000);
  check(!(await wide()), 'no sideways scroll in a run');
  check(await p.evaluate(() => { const ui = document.querySelector('#touchUI'); return !document.querySelector('#lanePad') && getComputedStyle(ui).display !== 'none' && [...ui.querySelectorAll('.t-btn:not([hidden])')].every(b => b.getBoundingClientRect().height >= 48) && !document.querySelector('#tbFire').hidden; }), 'the touch buttons show, finger-sized, FIRE included while auto-fire is off, and the bottom pad is gone');
  check(await p.evaluate(() => { const st = document.querySelector('#stage').getBoundingClientRect(); return st.bottom <= window.innerHeight + 1 && st.height >= 380; }), 'the stage fits the phone screen');
  check(await p.evaluate(() => { const eq = document.querySelector('#eq').getBoundingClientRect(), h = document.querySelector('#hearts').getBoundingClientRect(), st = document.querySelector('#stage').getBoundingClientRect(); return eq.top <= h.top + 1 && eq.top - st.top < 60; }), 'the equation stays at the top of a phone screen');
  s = await snap(p);
  const cvBox = await p.evaluate(() => { const r = document.querySelector('#cv').getBoundingClientRect(); return { left: r.left, top: r.top, w: r.width, h: r.height }; });
  /* the ghost stick: a thumb on the right half, pushed up-left, flies the ship up-left */
  const sx = cvBox.left + cvBox.w * .75, sy = cvBox.top + cvBox.h * .8;
  await p.touchscreen.touchStart(sx, sy); for (let i = 1; i <= 8; i++) { await p.touchscreen.touchMove(sx - i * 14, sy - i * 10); await wait(40); } await wait(200);
  const mid = await p.evaluate(() => !!window.__ms.G.players[0].stick); await p.touchscreen.touchEnd();
  const s2 = await snap(p);
  check(mid && s2 && s2.players[0].x < s.players[0].x - 40 && s2.players[0].y < s.players[0].y - 20, `a thumb on the right half makes a ghost stick that flies the ship (${Math.round(s.players[0].x)},${Math.round(s.players[0].y)} to ${Math.round(s2.players[0].x)},${Math.round(s2.players[0].y)})`);
  check(s2 && !s2.players[0].firing, 'with auto-fire off the ship holds fire');
  const fb = await p.evaluate(() => { const r = document.querySelector('#tbFire').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.touchscreen.touchStart(fb.x, fb.y); await wait(250); const s3 = await snap(p); await p.touchscreen.touchEnd();
  check(s3 && s3.players[0].firing, 'holding the FIRE button shoots');
  await p.evaluate(() => window.__ms.setAuto(true)); await wait(200);
  check(await p.evaluate(() => window.__ms.G.players[0].firing && document.querySelector('#tbFire').hidden), 'with auto-fire on a phone shoots with nothing held and FIRE hides');
  /* swap the sides: the buttons move right, only the left half answers as the stick */
  await p.evaluate(() => window.__ms.setStick(true)); await wait(100);
  const sw = { cls: await p.evaluate(() => document.querySelector('#touchUI').classList.contains('swap') && document.querySelector('#touchUI .t-btns').getBoundingClientRect().left > window.innerWidth / 2) };
  await p.touchscreen.touchStart(cvBox.left + cvBox.w * .8, cvBox.top + cvBox.h * .5); await wait(120); sw.rightIgnored = !(await p.evaluate(() => !!window.__ms.G.players[0].stick)); await p.touchscreen.touchEnd();
  await p.touchscreen.touchStart(cvBox.left + cvBox.w * .25, cvBox.top + cvBox.h * .5); await wait(120); sw.leftStick = await p.evaluate(() => !!window.__ms.G.players[0].stick); await p.touchscreen.touchEnd();
  check(sw.cls && sw.rightIgnored && sw.leftStick, 'swapping puts the buttons on the right and the stick on the left ' + JSON.stringify(sw));
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  check(mob.store.riley.state.stickLeft === true && mob.store.riley.state.autoFire === true, 'the stick side and auto-fire are saved with the profile');
  await p.close();

  check(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  await browser.close();
  console.log(`${n - failed} of ${n} checks passed${failed ? ', ' + failed + ' FAILED' : ''}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
