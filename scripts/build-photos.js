// Builder: fetch ≥5 real Wikimedia Commons photos per destination (queried by
// actual landmarks, since a raw city-name search returns junk) and write
// js/data-photos.js. Uses curl (Node fetch ignores the corporate proxy).
//
// RESUMABLE + CHECKPOINTING: it seeds from the existing js/data-photos.js, skips
// destinations that already have ≥5 photos, and rewrites the file after EVERY
// destination — so the flaky shared-IP rate limit can never lose progress.
// Re-run it as many times as needed; each run only fills what's still missing.
const fs = require('fs'), vm = require('vm'), { execFile } = require('child_process');

const TARGET = 6, MIN = 5;

// ── load data files (+ existing photos) to get all 108 destinations ────────
const ctx = { console, Math, Array, Object, JSON, encodeURIComponent };
vm.createContext(ctx);
const files = ['js/data.js', 'js/data-extra.js', 'js/data-destinations.js'];
if (fs.existsSync('js/data-photos.js')) files.push('js/data-photos.js');  // seed prior results
for (const f of files) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
vm.runInContext('var OUT = DESTINATIONS;', ctx);
const DEST = ctx.OUT;

// Seed PHOTOS from whatever's already attached (d.photos), keep ALL ids so each
// checkpoint writes a complete file.
const PHOTOS = {};
DEST.forEach(function (d) { PHOTOS[d.id] = Array.isArray(d.photos) ? d.photos.slice() : []; });
const todo = DEST.filter(function (d) { return PHOTOS[d.id].length < MIN; });
console.error('Loaded ' + DEST.length + ' destinations — ' + todo.length + ' still need photos');

function q(s) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(s) + '&gsrnamespace=6&gsrlimit=7' +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json';
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function curlOnce(url) {
  return new Promise(function (resolve) {
    execFile('curl', ['-sS', '--max-time', '25',
      '-H', 'User-Agent: IndiaExplore/1.0 (static travel site; educational)',
      url], { maxBuffer: 8 * 1024 * 1024 }, function (err, stdout) {
      if (err) return resolve(null);
      try {
        const j = JSON.parse(stdout);
        if (j.error) return resolve(null);                  // API error -> retry
        const pages = (j.query && j.query.pages) || {};      // no query = valid empty
        const urls = [];
        Object.keys(pages).forEach(function (k) {
          const ii = pages[k].imageinfo && pages[k].imageinfo[0];
          const u = ii && (ii.thumburl || ii.url);
          if (u && /\.(jpg|jpeg|png)$/i.test(u) && /upload\.wikimedia\.org/.test(u)) urls.push(u);
        });
        resolve(urls);
      } catch (e) { resolve(null); }                         // throttled HTML -> retry
    });
  });
}
async function curl(url) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = await curlOnce(url);
    if (r !== null) return r;
    await sleep(1200 + attempt * 1000);                      // back off on throttle
  }
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

// ── process one destination: query its top landmarks, aggregate, checkpoint ──
async function fillOne(d) {
  const places = (d.places || []).slice(0, 3);
  const groups = [];
  for (let i = 0; i < places.length; i++) {
    groups.push(await curl(q(places[i].name + ' ' + d.name)));
    await sleep(450);                                        // gentle pace
  }
  const out = [];
  groups.forEach(function (urls) {                           // pass 1: 2 per landmark
    urls.slice(0, 2).forEach(function (u) { if (out.length < TARGET && out.indexOf(u) < 0) out.push(u); });
  });
  if (out.length < TARGET) groups.forEach(function (urls) {  // pass 2: top up
    urls.forEach(function (u) { if (out.length < TARGET && out.indexOf(u) < 0) out.push(u); });
  });
  if (out.length >= MIN || out.length > PHOTOS[d.id].length) PHOTOS[d.id] = out;
  writeFile();                                               // checkpoint after each dest
  return out.length;
}

(async function run() {
  for (let i = 0; i < todo.length; i++) {
    const d = todo[i];
    const n = await fillOne(d);
    console.error('  [' + (i + 1) + '/' + todo.length + '] ' + d.id + ': ' + n + (n < MIN ? '  (sparse)' : ''));
  }
  const low = DEST.filter(function (d) { return PHOTOS[d.id].length < MIN; }).map(function (d) { return d.id + '(' + PHOTOS[d.id].length + ')'; });
  const total = Object.values(PHOTOS).reduce(function (a, b) { return a + b.length; }, 0);
  console.error('\nDONE — ' + DEST.length + ' destinations, ' + total + ' photos.');
  console.error('Still <5 (' + low.length + '): ' + (low.join(', ') || 'none'));
})();
