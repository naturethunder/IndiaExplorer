// Second pass: top up destinations that still have <5 photos, using broader
// queries (every place + destination/state + bare name). Resumable & checkpointing,
// shares the data-photos.js written by build-photos.js. Run: node scripts/build-photos-fill.js
const fs = require('fs'), vm = require('vm'), { execFile } = require('child_process');
const TARGET = 6, MIN = 5;

const ctx = { console, Math, Array, Object, JSON, encodeURIComponent };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/data-extra.js', 'js/data-destinations.js', 'js/data-photos.js'])
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
vm.runInContext('var OUT = DESTINATIONS;', ctx);
const DEST = ctx.OUT;

const PHOTOS = {};
DEST.forEach(function (d) { PHOTOS[d.id] = Array.isArray(d.photos) ? d.photos.slice() : []; });
const todo = DEST.filter(function (d) { return PHOTOS[d.id].length < MIN; });
console.error('Sparse destinations to top up: ' + todo.map(function (d) { return d.id + '(' + PHOTOS[d.id].length + ')'; }).join(', '));

function q(s) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(s) + '&gsrnamespace=6&gsrlimit=10' +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json';
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function clean(name) { return name.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); }

function curlOnce(url) {
  return new Promise(function (resolve) {
    execFile('curl', ['-sS', '--max-time', '25',
      '-H', 'User-Agent: IndiaExplore/1.0 (static travel site; educational)',
      url], { maxBuffer: 8 * 1024 * 1024 }, function (err, stdout) {
      if (err) return resolve(null);
      try {
        const j = JSON.parse(stdout);
        if (j.error) return resolve(null);
        const pages = (j.query && j.query.pages) || {};
        const urls = [];
        Object.keys(pages).forEach(function (k) {
          const ii = pages[k].imageinfo && pages[k].imageinfo[0];
          const u = ii && (ii.thumburl || ii.url);
          if (u && /\.(jpg|jpeg|png)$/i.test(u) && /upload\.wikimedia\.org/.test(u)) urls.push(u);
        });
        resolve(urls);
      } catch (e) { resolve(null); }
    });
  });
}
async function curl(url) {
  for (let a = 0; a < 8; a++) { const r = await curlOnce(url); if (r !== null) return r; await sleep(1200 + a * 1000); }
  return [];
}
function writeFile() {
  let body = '// AUTO-GENERATED — do not hand-edit. Real Wikimedia Commons photos per\n';
  body += '// destination, pre-fetched so the hero carousel is instant & accurate (no live\n';
  body += '// API call at page load). Rebuild with: node scripts/build-photos.js\n';
  body += '// Loaded AFTER data-destinations.js (on destination.html); attaches d.photos by id.\n';
  body += '(function () {\n  if (typeof DESTINATIONS === \'undefined\') return;\n  var PHOTOS = ';
  body += JSON.stringify(PHOTOS, null, 0).replace(/\],/g, '],\n    ').replace(/^\{/, '{\n    ').replace(/\}$/, '\n  }');
  body += ';\n  DESTINATIONS.forEach(function (d) { if (PHOTOS[d.id] && PHOTOS[d.id].length) d.photos = PHOTOS[d.id]; });\n})();\n';
  fs.writeFileSync('js/data-photos.js', body);
}

(async function run() {
  for (const d of todo) {
    // Broader query list: every place (cleaned) + dest, place + state, dest + state, bare dest.
    const queries = [];
    (d.places || []).forEach(function (p) { queries.push(clean(p.name) + ' ' + d.name); });
    (d.places || []).forEach(function (p) { queries.push(clean(p.name) + ' ' + d.state); });
    queries.push(d.name + ' ' + d.state);
    queries.push(d.name);
    const out = PHOTOS[d.id].slice();
    for (const query of queries) {
      if (out.length >= TARGET) break;
      const urls = await curl(q(query));
      urls.forEach(function (u) { if (out.length < TARGET && out.indexOf(u) < 0) out.push(u); });
      await sleep(450);
    }
    PHOTOS[d.id] = out;
    writeFile();
    console.error('  ' + d.id + ': ' + out.length + (out.length < MIN ? '  (still sparse)' : ''));
  }
  const low = DEST.filter(function (d) { return PHOTOS[d.id].length < MIN; }).map(function (d) { return d.id + '(' + PHOTOS[d.id].length + ')'; });
  const total = Object.values(PHOTOS).reduce(function (a, b) { return a + b.length; }, 0);
  console.error('\nDONE — ' + total + ' photos total. Still <5: ' + (low.join(', ') || 'none'));
})();
