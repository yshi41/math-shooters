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
const riley0 = () => ({ cur: 100, games: 1, stars: { 'add-1': 2, 'add-2': 1 }, best: { 'add-1': 900 }, skill: {}, facts: {}, ops: {}, perks: ['p_heart'], autoFire: true, coop: { played: 0, wins: 0 } });

/* what the drive loop sees each tick */
const snap = p => p.evaluate(() => { const G = window.__ms.G; if (!G) return null; const cv = document.querySelector('#cv');
  return { phase: G.phase, wave: G.wave, correct: G.correct, wrongs: G.wrongs, W: cv.clientWidth, H: cv.clientHeight, qOpen: G.qOpen, offer: G.offer, taken: G.taken,
    players: G.players.map(q => ({ x: q.x, y: q.y, hearts: q.hearts, bombs: q.bombs, stack: q.upStack.length, down: q.down, out: q.out, firing: q.firing, up: q.up })),
    bubbles: G.bubbles.filter(b => b.state === 'live').map(b => ({ x: b.x, y: b.y, ok: b.ok })),
    enemies: G.enemies.filter(e => !e.flee).map(e => ({ x: e.x, y: e.y })), eshots: G.eshots.map(s => ({ x: s.x, y: s.y })), caps: G.capsules.map(c => ({ x: c.x, y: c.y })) }; });
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
  check(mock.stats.gets === 1, 'one GET loads every save'); check(mock.stats.realHits === 0, 'the real service is never called');
  check(await p.evaluate(() => document.querySelector('[data-kid=riley]').textContent.includes('100')), 'Riley shows her 100 treats');
  await p.click('[data-kid=riley]'); await wait(200);
  check(await p.evaluate(() => document.querySelector('[data-perk=p_heart] button').textContent === 'Owned'), 'the store shows Heart Locket as owned');
  check(await p.evaluate(() => !document.querySelector('#coopBtn').hidden), 'a computer gets the Play together button');
  await p.click('#playBtn'); await wait(200);
  check(await p.evaluate(() => !document.querySelector('[data-w="add-3"]').disabled && document.querySelector('[data-w="add-4"]').disabled && document.querySelector('[data-w="sub-1"]').disabled), 'the map opens add-3 and locks add-4 and sub-1');
  check(await p.evaluate(() => document.querySelectorAll('[data-w="add-1"] .st.on').length === 2), 'add-1 shows its two stars');

  /* 2. a solo world (Addition 3): catch answers, take an upgrade, drop one on purpose and grab it back; another device saves meanwhile */
  await p.click('[data-w="add-3"]'); await wait(300);
  mock.store.riley = { rev: 4, state: Object.assign(riley0(), { cur: 150, stars: { 'add-1': 2, 'add-2': 1, 'sub-1': 1 } }) };
  let picked = 0, wrongDone = false, wrongCheck = null, capsuleGrabbed = false, wrapSeen = false, lastBubbleY = null, stackBefore = 0, prev = null;
  for (let i = 0; i < 3000; i++) {
    const s = await snap(p); if (!s) break;
    if (s.phase === 'upgrade') { if (picked < s.wave) { picked = s.wave;
        /* take a losable card so the wrong-catch check below has something to knock loose */
        const idx = await p.evaluate(() => [...document.querySelectorAll('#upCards .up-card')].findIndex(b => ['rapid', 'spread', 'power', 'shield', 'speed', 'slow', 'magnet', 'lucky', 'bomb'].includes(b.dataset.up)));
        await p.keyboard.press(String((idx < 0 ? 0 : idx) + 1)); await wait(150); } continue; }
    if (s.phase !== 'run') { await stop(p, 0); await wait(80); continue; }
    const me = s.players[0], ok = s.bubbles.find(b => b.ok), wrong = s.bubbles.find(b => !b.ok);
    if (ok) { if (lastBubbleY != null && ok.y < lastBubbleY - s.H * .5) wrapSeen = true; lastBubbleY = ok.y; }
    const zoneY = y => Math.max(s.H * .56, Math.min(y, s.H - 40));
    if (prev && !wrongDone && s.wrongs > prev.wrongs) { wrongDone = true; stackBefore = prev.stack; wrongCheck = { hearts: me.hearts < prev.hearts, stack: me.stack < prev.stack, caps: s.caps.length > 0 }; }
    if (s.wave >= 2 && !wrongDone) {
      /* on purpose: first get any level back that an enemy knocked off, then fly into a wrong answer */
      if (me.stack === 0 && s.caps.length) await steer(p, 0, s, s.caps[0].x, zoneY(s.caps[0].y), true);
      else if (me.stack > 0 && wrong) await steer(p, 0, s, wrong.x, zoneY(wrong.y), true);
      else if (ok && me.stack === 0) await steer(p, 0, s, ok.x, zoneY(ok.y));
      else await stop(p, 0);
    } else if (wrongDone && !capsuleGrabbed) {
      if (me.stack >= stackBefore) capsuleGrabbed = true;
      else if (s.caps.length) await steer(p, 0, s, s.caps[0].x, zoneY(s.caps[0].y), true);
      else if (ok) await steer(p, 0, s, ok.x, zoneY(ok.y)); else await stop(p, 0);
    } else if (ok) await steer(p, 0, s, ok.x, zoneY(ok.y));
    else await stop(p, 0);
    prev = { hearts: me.hearts, stack: me.stack, wrongs: s.wrongs };
    await wait(50);
  }
  check(picked === 2, 'an upgrade was picked after waves 1 and 2 (' + picked + ')');
  check(wrongDone && wrongCheck.hearts && wrongCheck.stack && wrongCheck.caps, 'a wrong catch cost a heart and a power-up level, which floated off as a capsule ' + JSON.stringify(wrongCheck));
  check(capsuleGrabbed, 'the dropped power-up was grabbed back');
  check(wrapSeen, 'a missed bubble came back around at the top');
  check(await until(() => p.evaluate(() => !document.querySelector('#results').hidden), 5000), 'the world ended on the results screen');
  const won = await p.evaluate(() => document.querySelector('#resTitle').textContent.includes('clear') || document.querySelector('#resTitle').textContent.includes('Perfect'));
  check(won, 'the world was cleared (' + await p.evaluate(() => document.querySelector('#resTitle').textContent) + ')');
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  const r = mock.store.riley.state;
  check(mock.store.riley.rev === 5, 'the save landed on top of the other device (rev ' + mock.store.riley.rev + ')');
  check(mock.stats.merges === 1, 'the service merged it');
  check((r.stars['add-3'] | 0) >= 1 && r.stars['sub-1'] === 1 && r.stars['add-1'] === 2, 'stars kept from both copies (' + JSON.stringify(r.stars) + ')');
  check(r.cur > 150, 'treats were added to the other device total (' + r.cur + ')');
  check(r.ops.add && r.ops.add.w >= 1 && r.ops.add.r >= 10, 'the answer log reached the save (' + JSON.stringify(r.ops) + ')');
  check(await p.evaluate(() => window.__storageWrites) === 0, 'nothing was written to browser storage');
  check(await p.evaluate(() => { try { return localStorage.length === 0 && sessionStorage.length === 0; } catch (e) { return true; } }), 'browser storage is empty');
  check(await p.evaluate(() => !document.querySelector('#nextBtn').hidden), 'Next world is offered after a clear');

  /* 3. the store: a perk bought now applies to the next world */
  await p.click('#mapBtn'); await wait(200); await p.click('#mapBack'); await wait(200);
  await p.click('[data-perk=p_bomb] button'); await wait(300);
  check(await p.evaluate(() => window.__ms.P().perks.includes('p_bomb')), 'Spare Bomb was bought');
  await until(() => p.evaluate(() => window.__ms.net.idle()));
  check(mock.store.riley.state.perks.includes('p_bomb') && mock.store.riley.state.perks.includes('p_heart') && mock.stats.conflicts === 0, 'the purchase reached the save without a conflict');
  await p.evaluate(() => window.__ms.startWorld(0, 1)); await wait(300);
  let s = await snap(p);
  check(s && s.players[0].bombs === 2 && s.players[0].hearts === 6, 'the next world starts with 2 bombs and 6 hearts');
  await p.keyboard.press('p'); await wait(150);
  check(await p.evaluate(() => !document.querySelector('#pauseMenu').hidden && window.__ms.G.paused), 'P pauses');
  await p.click('#quitBtn'); await wait(300);
  check(await p.evaluate(() => !document.querySelector('#results').hidden), 'quitting from pause ends on the results screen');

  /* 4. two players on one keyboard: separate ships, a rescue, and four cards to share */
  await p.click('#mapBtn'); await wait(200);
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
  check(await p.evaluate(() => { const pad = document.querySelector('#lanePad'); return getComputedStyle(pad).display === 'grid' && [...pad.querySelectorAll('button:not([hidden])')].every(b => b.getBoundingClientRect().height >= 48); }), 'the pad shows with finger-sized buttons');
  check(await p.evaluate(() => { const st = document.querySelector('#stage').getBoundingClientRect(), pad = document.querySelector('#lanePad').getBoundingClientRect(); return pad.bottom <= window.innerHeight + 1 && st.height >= 380; }), 'the stage and pad fit the phone screen');
  s = await snap(p);
  const cvBox = await p.evaluate(() => { const r = document.querySelector('#cv').getBoundingClientRect(); return { left: r.left, top: r.top, w: r.width, h: r.height }; });
  const sx = cvBox.left + cvBox.w * .5, sy = cvBox.top + cvBox.h * .85;
  await p.touchscreen.touchStart(sx, sy); for (let i = 1; i <= 8; i++) { await p.touchscreen.touchMove(sx - i * 14, sy - i * 10); await wait(40); } await wait(200); await p.touchscreen.touchEnd();
  const s2 = await snap(p);
  check(s2 && s2.players[0].x < s.players[0].x - 40 && s2.players[0].y < s.players[0].y - 20, `a drag moves the ship in both axes (${Math.round(s.players[0].x)},${Math.round(s.players[0].y)} to ${Math.round(s2.players[0].x)},${Math.round(s2.players[0].y)})`);
  check(s2 && !s2.players[0].firing, 'no auto-fire: the ship holds fire');
  const fb = await p.evaluate(() => { const r = document.querySelector('#padF').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.touchscreen.touchStart(fb.x, fb.y); await wait(250); const s3 = await snap(p); await p.touchscreen.touchEnd();
  check(s3 && s3.players[0].firing, 'holding FIRE shoots');
  await p.close();

  check(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  await browser.close();
  console.log(`${n - failed} of ${n} checks passed${failed ? ', ' + failed + ' FAILED' : ''}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
