/* Crash fuzz: node fuzz.js ../index.html [seconds-per-scenario]
   Plays a set of worlds (every sector, both bosses, Endless, co-op) with the bot plus random power-ups, spawns,
   bombs, lasers, upgrade picks and key presses, and reports every page error or stalled frame.
   Talks only to the in-memory save stand-in. */
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const { create } = require('./mockcloud.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const file = path.resolve(process.argv[2] || '../index.html'), SECS = +(process.argv[3] || 40);
const F = 'file:///' + file.replace(/\\/g, '/');
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(100); } return false; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const stars = {}; for (const s of ['add', 'sub', 'tables', 'mul', 'div', 'mix']) for (let w = 1; w <= 6; w++) stars[s + '-' + w] = 3;
const SCENARIOS = [[0, 1], [1, 3], [2, 6], [3, 6], [4, 4], [5, 5], ['endless', 1], [0, 2, true], [1, 6, true]];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-gpu'] });
  const errs = [];
  const mock = create();
  mock.store.riley = { rev: 1, state: { cur: 500, games: 10, stars, best: {}, skill: {}, facts: {}, ops: {}, perks: ['p_heart', 'p_pick4'], ups: { rapid: 3, power: 2, spread: 2, pierce: 1, drone: 2, missile: 2 }, autoFire: true, coop: { played: 0, wins: 0 } } };
  mock.store.charlie = { rev: 1, state: { cur: 50, games: 2, stars: { 'add-1': 1 }, best: {}, skill: {}, facts: {}, ops: {}, perks: [], autoFire: false, coop: { played: 0, wins: 0 } } };
  const p = await browser.newPage();
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.setViewport({ width: 1000, height: 820 });
  await mock.attach(p);
  await p.goto(F);
  await until(() => p.evaluate(() => !document.querySelector('.profile-card').disabled));
  await p.click('[data-kid=riley]'); await wait(200);
  const snap = () => p.evaluate(() => { const G = window.__ms.G; if (!G) return null; return { t: G.t, phase: G.phase, wave: G.wave, players: G.players.map(q => ({ x: q.x, y: q.y, down: q.down, out: q.out })), ok: G.bubbles.filter(b => b.state === 'live' && b.ok).map(b => ({ x: b.x, y: b.y })), enemies: G.enemies.length, pickups: G.pickups.length, bullets: G.bullets.length, parts: G.parts.length }; });
  let stalls = 0, finished = 0, scen = 0;
  for (const [si, wi, coop] of SCENARIOS) {
    scen++;
    await p.evaluate((si, wi, coop) => { window.__ms.setCoop(coop ? ['riley', 'charlie'] : null); window.__ms.startWorld(si, wi); }, si, wi, coop);
    await until(() => p.evaluate(() => window.__ms.G && window.__ms.G.phase === 'run'), 8000);
    const t0 = Date.now(); let lastT = -1, sameT = 0, ended = false;
    while (Date.now() - t0 < SECS * 1000) {
      const s = await snap();
      if (!s) { ended = true; break; }
      if (s.t === lastT && s.phase !== 'upgrade') { sameT++; if (sameT === 20) { stalls++; errs.push(`stall: scenario ${scen} phase ${s.phase} t=${s.t}`); } } else sameT = 0; lastT = s.t;
      /* the bot flies toward the right answer and holds fire; a random action every tick on top */
      for (let i = 0; i < s.players.length; i++) { const me = s.players[i], ok = s.ok[0]; const tx = ok ? ok.x : 300, ty = ok ? Math.max(s.H * .5 || 350, ok.y) : 500;
        await p.evaluate((i, h) => window.__ms.input(i, h), i, { left: tx < me.x - 6, right: tx > me.x + 6, up: ty < me.y - 6, down: ty > me.y + 6, fire: Math.random() < .8 }); }
      const r = Math.random();
      try {
        if (s.phase === 'upgrade') await p.keyboard.press(String(1 + Math.floor(Math.random() * 4)));
        else if (r < .06) await p.evaluate(() => { const ms = window.__ms, ids = Object.keys(ms.POWERS); ms.givePower(0, ids[Math.floor(Math.random() * ids.length)]); });
        else if (r < .1) await p.evaluate(() => { const ms = window.__ms, G = ms.G; if (G.phase !== 'run') return; const f = [ms.spawnRock, ms.spawnSnatcher, () => ms.spawnSwarm(), ms.spawnHydra, ms.spawnAstro, ms.spawnBoss][Math.floor(Math.random() * 6)]; if (G.enemies.length < 14) f(); });
        else if (r < .13) await p.evaluate(() => { const ms = window.__ms, G = ms.G; for (const q of G.players) { q.bombs = Math.max(q.bombs, 1); ms.useBomb(q); } });
        else if (r < .16) await p.evaluate(() => { const ms = window.__ms, G = ms.G; for (const q of G.players) { q.charge = 1; ms.useSpecial(q); } });
        else if (r < .18) await p.evaluate(() => { const ms = window.__ms, G = ms.G, ids = Object.keys(ms.UPGRADES); for (let i = 0; i < G.players.length; i++) ms.applyUp(i, ids[Math.floor(Math.random() * ids.length)]); });
        else if (r < .2) await p.evaluate(() => { const ms = window.__ms, G = ms.G; for (const e of G.enemies) if (!e.flee && Math.random() < .5) ms.damage(e, 3); });
        else if (r < .21) await p.keyboard.press(pick(['b', 'ShiftLeft', 'p', 'p', 'Escape', 'Escape', 'q', '/', 'ShiftRight']));
        else if (r < .215) await p.evaluate(() => { const ms = window.__ms, G = ms.G; if (G.phase === 'run' && !G.blitzDone) ms.startBlitz(); });
        else if (r < .22) await p.evaluate(() => { const ms = window.__ms, G = ms.G; if (G.phase === 'run' && G.correct >= 1) G.correct = 5; });
        else if (r < .225) await p.evaluate(() => { const ms = window.__ms; ms.setAuto(Math.random() < .5); ms.setStick(Math.random() < .5); });
        else if (r < .23) await p.evaluate(() => { const G = window.__ms.G; for (const q of G.players) q.hearts = Math.random() < .3 ? 1 : 9; });
        /* keep the pause from sticking */
        await p.evaluate(() => { const G = window.__ms.G; if (G && G.paused && Math.random() < .5) document.querySelector('#resumeBtn').click(); });
      } catch (e) { errs.push('driver: ' + e.message); }
      await wait(50);
    }
    const res = await p.evaluate(() => !document.querySelector('#results').hidden);
    if (!res) { await p.evaluate(() => { const G = window.__ms.G; if (G && G.paused) document.querySelector('#resumeBtn').click(); }); await p.keyboard.press('p'); await wait(150); await p.click('#quitBtn').catch(() => {}); await wait(400); }
    if (await p.evaluate(() => !document.querySelector('#results').hidden)) { finished++; await p.click('#mapBtn'); await wait(200); } else errs.push(`scenario ${scen} did not reach results (ended=${ended})`);
    await p.evaluate(() => window.__ms.setCoop(null));
    console.log(`scenario ${scen} [${si},${wi}${coop ? ',coop' : ''}] done, errors so far ${errs.length}`);
  }
  await until(() => p.evaluate(() => window.__ms.net.idle()), 5000);
  const r = mock.store.riley.state;
  console.log('riley save:', JSON.stringify({ cur: r.cur, medals: r.medals, missions: r.missions, best: r.best, ups: r.ups }).slice(0, 600));
  await browser.close();
  console.log(`${finished} of ${SCENARIOS.length} scenarios reached results, ${stalls} stalls, ${errs.length} errors`);
  for (const e of [...new Set(errs)].slice(0, 40)) console.log('  ', e);
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
