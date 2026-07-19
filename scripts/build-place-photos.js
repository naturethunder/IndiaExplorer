// Builder: fetch real Wikimedia Commons photos for EACH place (attraction) of
// every destination and write js/data-place-photos.js. This makes the "Top Places
// to Visit" cards + the place-detail modal show the REAL photo of that place
// instead of a random picsum placeholder — with no live API call at page load.
//
// Query is "<place name> <destination name>" (the same query fetchPlacePhotos and
// the hero builder use — a raw place name alone returns junk). We keep only real
// upload.wikimedia.org .jpg/.png urls, up to PER_PLACE per place.
//
// RESUMABLE + CHECKPOINTING: it seeds from the existing js/data-place-photos.js,
// skips places that already have photos, and rewrites the file after EVERY
// destination — so the flaky shared-IP rate limit can never lose progress.
// Re-run it as many times as needed; each run only fills what's still missing.
//
// Runs STRICTLY SERIAL with backoff: the corporate shared IP is rate-limited by
// Commons ("too many requests"); concurrency triggers throttling and empties results.
const fs = require('fs'), vm = require('vm'), { execFile } = require('child_process');

const PER_PLACE = 3;        // photos to keep per place (card uses [0], modal uses all)
const OUT_FILE = 'js/data-place-photos.js';

// ── load data files to get all 108 destinations + their places ──────────────
const ctx = { console, Math, Array, Object, JSON, encodeURIComponent };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/data-extra.js', 'js/data-destinations.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}
vm.runInContext('var OUT = DESTINATIONS;', ctx);
const DEST = ctx.OUT;

// ── seed PHOTOS from the existing file (so re-runs only fill gaps) ───────────
// Shape: { destId: { "Place Name": ["url", ...] } }
let PHOTOS = {};
if (fs.existsSync(OUT_FILE)) {
  try {
    const seedCtx = { PHOTOS: {} };
    vm.createContext(seedCtx);
    // the file is an IIFE; re-expose its inner map by matching the literal
    const m = fs.readFileSync(OUT_FILE, 'utf8').match(/var PP = (\{[\s\S]*?\});\n/);
    if (m) PHOTOS = JSON.parse(m[1]);
  } catch (e) { PHOTOS = {}; }
}
DEST.forEach(function (d) { if (!PHOTOS[d.id]) PHOTOS[d.id] = {}; });

function need(d) {
  return (d.places || []).filter(function (p) {
    var got = PHOTOS[d.id][p.name];
    return !(got && got.length);
  });
}
const todoDest = DEST.filter(function (d) { return need(d).length > 0; });
let totalPlaces = 0; DEST.forEach(function (d) { totalPlaces += (d.places || []).length; });
let havePlaces = 0; DEST.forEach(function (d) { havePlaces += Object.keys(PHOTOS[d.id]).filter(function (k) { return PHOTOS[d.id][k] && PHOTOS[d.id][k].length; }).length; });
console.error('Loaded ' + DEST.length + ' destinations, ' + totalPlaces + ' places — ' +
  (totalPlaces - havePlaces) + ' places still need photos across ' + todoDest.length + ' destinations');

function q(s) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(s) + '&gsrnamespace=6&gsrlimit=8' +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json';
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
        if (j.error) return resolve(null);                   // API error -> retry
        const pages = (j.query && j.query.pages) || {};       // no query = valid empty
        const urls = [];
        Object.keys(pages).forEach(function (k) {
          const ii = pages[k].imageinfo && pages[k].imageinfo[0];
          const u = ii && (ii.thumburl || ii.url);
          if (u && /\.(jpg|jpeg|png)$/i.test(u) && /upload\.wikimedia\.org/.test(u)) urls.push(u);
        });
        resolve(urls);
      } catch (e) { resolve(null); }                          // throttled HTML -> retry
    });
  });
}
async function curl(url) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = await curlOnce(url);
    if (r !== null) return r;
    await sleep(1200 + attempt * 1000);                       // back off on throttle
  }
  return [];
}

function writeFile() {
  let body = '// AUTO-GENERATED — do not hand-edit. Real Wikimedia Commons photos per PLACE\n';
  body += '// (attraction), pre-fetched so the "Top Places to Visit" cards + place modal show\n';
  body += '// the real photo of that place instantly (no live API call, no random picsum).\n';
  body += '// Rebuild with: node scripts/build-place-photos.js\n';
  body += '// Loaded AFTER data-destinations.js (on destination.html); sets p.image + p.photos by name.\n';
  body += '(function () {\n  if (typeof DESTINATIONS === \'undefined\') return;\n  var PP = ';
  body += JSON.stringify(PHOTOS, null, 0);
  body += ';\n';
  body += '  DESTINATIONS.forEach(function (d) {\n';
  body += '    var m = PP[d.id]; if (!m) return;\n';
  body += '    (d.places || []).forEach(function (p) {\n';
  body += '      var urls = m[p.name];\n';
  body += '      if (urls && urls.length) { p.photos = urls; p.image = urls[0]; }\n';
  body += '    });\n';
  body += '  });\n})();\n';
  fs.writeFileSync(OUT_FILE, body);
}

// ── process one destination: query each of its places, checkpoint ────────────
async function fillOne(d) {
  const places = need(d);
  let filled = 0;
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const urls = await curl(q(p.name + ' ' + d.name));
    const out = [];
    urls.forEach(function (u) { if (out.length < PER_PLACE && out.indexOf(u) < 0) out.push(u); });
    if (out.length) { PHOTOS[d.id][p.name] = out; filled++; }
    await sleep(400);                                         // gentle pace
  }
  writeFile();                                                // checkpoint after each dest
  return { filled: filled, total: places.length };
}

(async function run() {
  for (let i = 0; i < todoDest.length; i++) {
    const d = todoDest[i];
    const r = await fillOne(d);
    console.error('  [' + (i + 1) + '/' + todoDest.length + '] ' + d.id +
      ': ' + r.filled + '/' + r.total + ' places' + (r.filled < r.total ? '  (some sparse)' : ''));
  }
  let done = 0, miss = 0;
  DEST.forEach(function (d) {
    (d.places || []).forEach(function (p) {
      if (PHOTOS[d.id][p.name] && PHOTOS[d.id][p.name].length) done++; else miss++;
    });
  });
  console.error('\nDONE — ' + done + ' places with real photos, ' + miss + ' still empty (will use picsum).');
})();
