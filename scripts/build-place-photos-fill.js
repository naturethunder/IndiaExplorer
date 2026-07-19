// Second pass for PLACE photos: fill the places build-place-photos.js could not,
// using broader query variants. The leftovers are activity-style names
// ("Bungee Jumping at Mohan Chatti", "Jeep Safari (Central Range)") that never
// match a Commons file title verbatim — so we try, in order:
//   1. name without parentheticals + destination
//   2. the parenthetical content + destination   ("Khadir Bet Kutch")
//   3. core proper noun (activity words stripped) + destination
//   4. text after " at / on / to " + destination  ("Mohan Chatti Rishikesh")
//   5. each "&"/"–"-separated segment + destination ("Kasol Manali", "Kheerganga Manali")
//   6. cleaned name + state
//   7. core noun + state
//   8. bare cleaned name
// LAST RESORT: reuse the destination's own real photos (d.photos) so the card
// shows a real photo of the area instead of a random picsum.
//
// Resumable & checkpointing: seeds from js/data-place-photos.js, skips places
// that already have photos, rewrites the file after every destination (same
// `var PP = {...};` shape build-place-photos.js seeds from). STRICTLY SERIAL
// with backoff — the corporate shared IP is rate-limited by Commons.
// Run: node scripts/build-place-photos-fill.js
const fs = require('fs'), vm = require('vm'), { execFile } = require('child_process');

const PER_PLACE = 3;
const OUT_FILE = 'js/data-place-photos.js';

// ── load data files to get all 108 destinations + their places + d.photos ───
const ctx = { console, Math, Array, Object, JSON, encodeURIComponent };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/data-extra.js', 'js/data-destinations.js', 'js/data-photos.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}
vm.runInContext('var OUT = DESTINATIONS;', ctx);
const DEST = ctx.OUT;

// ── seed PHOTOS from the existing file (so re-runs only fill gaps) ───────────
let PHOTOS = {};
if (fs.existsSync(OUT_FILE)) {
  try {
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
console.error('Sparse places to fill: ' +
  todoDest.reduce(function (a, d) { return a + need(d).length; }, 0) +
  ' across ' + todoDest.length + ' destinations');

function q(s) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(s) + '&gsrnamespace=6&gsrlimit=8' +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json';
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function clean(name) { return name.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); }
function paren(name) { var m = name.match(/\(([^)]+)\)/); return m ? m[1].replace(/zone|range/ig, '').trim() : ''; }
// strip activity/generic words so "Dawn Boat Ride on Ganga" → "Ganga"
var ACTIVITY_RE = /\b(jeep|safari|trek|trekking|ride|rides|boat|tour|tours|walk|cruise|camp|camping|bungee|jumping|rafting|kayaking|paragliding|day|dawn|sunrise|sunset|point|viewpoint|summit|festival|grounds|circuit|beach\s+camp|at|on|of|to|the|&|and)\b/ig;
function core(name) { return clean(name).replace(ACTIVITY_RE, ' ').replace(/[–—\-\/,]/g, ' ').replace(/\s+/g, ' ').trim(); }
function afterPrep(name) { var m = clean(name).match(/\b(?:at|on|to)\s+(.+)$/i); return m ? m[1].trim() : ''; }
function segments(name) {
  return clean(name).split(/\s*(?:&|\band\b|–|—|\/)\s*/i)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 3; });
}

function variants(p, d) {
  var list = [];
  function add(s) { s = (s || '').replace(/\s+/g, ' ').trim(); if (s.length > 3 && list.indexOf(s) < 0) list.push(s); }
  add(clean(p.name) + ' ' + d.name);
  add(paren(p.name) && (paren(p.name) + ' ' + d.name));
  add(core(p.name) && core(p.name) !== clean(p.name) ? core(p.name) + ' ' + d.name : '');
  add(afterPrep(p.name) && (afterPrep(p.name) + ' ' + d.name));
  segments(p.name).forEach(function (s) { if (s !== clean(p.name)) add(s + ' ' + d.name); });
  add(clean(p.name) + ' ' + d.state);
  add(core(p.name) && (core(p.name) + ' ' + d.state));
  add(clean(p.name));
  return list;
}

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

(async function run() {
  for (let i = 0; i < todoDest.length; i++) {
    const d = todoDest[i];
    const places = need(d);
    // urls already used by this destination's other places — keep cards distinct
    const used = {};
    Object.keys(PHOTOS[d.id]).forEach(function (k) {
      (PHOTOS[d.id][k] || []).forEach(function (u) { used[u] = 1; });
    });
    let filled = 0, fallback = 0;
    for (const p of places) {
      const out = [];
      for (const v of variants(p, d)) {
        if (out.length >= PER_PLACE) break;
        const urls = await curl(q(v));
        urls.forEach(function (u) {
          if (out.length < PER_PLACE && out.indexOf(u) < 0 && !used[u]) out.push(u);
        });
        await sleep(450);
      }
      if (!out.length && Array.isArray(d.photos)) {
        // last resort: the destination's own real photos (rotated per place so
        // neighbouring cards differ) — a real photo of the area beats picsum
        for (let k = 0; k < d.photos.length && out.length < PER_PLACE; k++) {
          const u = d.photos[(k + filled + fallback) % d.photos.length];
          if (out.indexOf(u) < 0) out.push(u);
        }
        if (out.length) fallback++;
      } else if (out.length) filled++;
      if (out.length) {
        PHOTOS[d.id][p.name] = out;
        out.forEach(function (u) { used[u] = 1; });
      }
    }
    writeFile();
    console.error('  [' + (i + 1) + '/' + todoDest.length + '] ' + d.id + ': ' +
      filled + ' found + ' + fallback + ' dest-photo fallback of ' + places.length);
  }
  let done = 0, miss = 0;
  DEST.forEach(function (d) {
    (d.places || []).forEach(function (p) {
      if (PHOTOS[d.id][p.name] && PHOTOS[d.id][p.name].length) done++; else miss++;
    });
  });
  console.error('\nDONE — ' + done + ' places with real photos, ' + miss + ' still empty.');
})();
