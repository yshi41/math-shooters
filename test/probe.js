/* Screenshots for an eye check: node probe.js ../index.html  (writes probe-*.png here, gitignored) */
const puppeteer = require('puppeteer-core');
const path = require('path');
const { create } = require('./mockcloud.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const F = 'file:///' + path.resolve(process.argv[2] || '../index.html').replace(/\\/g, '/');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-gpu'] });
  for (const [tag, vp] of [['desk', { width: 1000, height: 820 }], ['phone', { width: 390, height: 800, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
    const mock = create(); mock.store.riley = { rev: 1, state: { cur: 140, games: 3, stars: { 'add-1': 3, 'add-2': 2, 'add-3': 1 }, best: { 'add-1': 1200 }, skill: {}, facts: {}, ops: {}, perks: ['p_heart'], autoFire: true, coop: { played: 0, wins: 0 } } };
    const p = await browser.newPage(); await p.setViewport(vp); await mock.attach(p); await p.goto(F);
    await wait(600); await p.screenshot({ path: `probe-${tag}-menu.png` });
    await p.evaluate(() => document.querySelector('[data-kid=riley]').click()); await wait(300); await p.screenshot({ path: `probe-${tag}-hub.png`, fullPage: true });
    await p.evaluate(() => document.querySelector('#playBtn').click()); await wait(300); await p.screenshot({ path: `probe-${tag}-map.png`, fullPage: true });
    await p.evaluate(() => window.__ms.startWorld(0, 3)); await wait(6500); await p.screenshot({ path: `probe-${tag}-run.png` });
    if (tag === 'desk') {
      await p.evaluate(() => { const G = window.__ms.G; G.correct = 5; }); await wait(100);
      await p.evaluate(() => { const G = window.__ms.G; const b = G.bubbles.find(b => b.state === 'live' && b.ok); if (b) { b.x = G.players[0].x; b.y = G.players[0].y; } });
      await wait(2600); await p.screenshot({ path: 'probe-desk-upgrade.png' });
      await p.keyboard.press('1'); await wait(2500);
      await p.evaluate(() => { const G = window.__ms.G; const b = G.bubbles.find(b => b.state === 'live' && !b.ok); if (b) { b.x = G.players[0].x; b.y = G.players[0].y; } });
      await wait(700); await p.screenshot({ path: 'probe-desk-wrong.png' });
      await p.evaluate(() => { window.__ms.setCoop(['riley', 'charlie']); window.__ms.startWorld(0, 1); }); await wait(5000); await p.screenshot({ path: 'probe-desk-coop.png' });
    }
    await p.close();
  }
  await browser.close(); console.log('probe done');
})().catch(e => { console.error(e); process.exit(1); });
