/* Builds index.html from src/template.html and src/game.js.
   Mechanics pass: placeholder art only. The theme pass will copy the Spelling Worlds palettes, scenes and
   characters here by named anchors (see times-table-worlds/build.js for the css span and js parts list)
   and inline them at the same kind of markers.
   Output: index.html for GitHub Pages (saves go to the Worker). */
const fs = require('fs'), path = require('path');
const D = __dirname;
const WORKER = 'https://math-shooters-saves.yshi41.workers.dev';
const game = fs.readFileSync(path.join(D, 'src', 'game.js'), 'utf8');
const BUILD = (game.match(/const BUILD='([^']+)'/) || [])[1];
if (!BUILD) throw new Error('src/game.js must set const BUILD');
let body = fs.readFileSync(path.join(D, 'src', 'template.html'), 'utf8').replace('/*@@GAME_JS@@*/', () => game);
for (const m of body.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);
if (/localStorage|sessionStorage|indexedDB/.test(body)) throw new Error('browser storage must never be used: progress lives only on the save service');
const title = (body.match(/<title>.*?<\/title>/) || [''])[0];
const pagesBody = body.replace(title + '\n', '');
const icon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1b2f4d"/><circle cx="32" cy="24" r="14" fill="#7cc6ff" opacity=".9"/><path d="M32 30 L44 56 Q32 63 20 56 Z" fill="#38bdf8"/><text x="32" y="30" font-family="Arial,sans-serif" font-weight="700" font-size="18" text-anchor="middle" fill="#0f1b2d">+</text></svg>');
const head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + title + '\n<meta name="theme-color" content="#1b2f4d">\n<link rel="icon" href="' + icon + '">\n'
  + '<script>window.MS_CLOUD=window.MS_CLOUD||"' + WORKER + '";</script>\n'
  + '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#c9dbf0;color:#17283a}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n';
const pages = head + pagesBody + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(D, 'index.html'), pages);
console.log('index.html', pages.length, 'bytes, build', BUILD);
