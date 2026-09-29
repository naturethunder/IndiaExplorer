/**
 * scripts/bulk/fix_internal_dupes.js
 *
 * Second-pass fixer: Scans all destination JSON files for internal duplicate photo URLs
 * within topPlaces (same URL used in multiple places within the same file).
 * Replaces duplicates with unique zero-collision alternatives.
 *
 * Usage: node scripts/bulk/fix_internal_dupes.js [--dry-run] [--limit=N]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../../data/destinations');
const PIXABAY_PATTERN = /pixabay\.com\/get\//i;
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : Infinity;
const DELAY_MS = 400;

const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const UNSPLASH_KEY = 'b5SJtVH8cpSj584Voko6hCJIP8XfBX15M693dDqMh4o';

// ─── Build global URL registry ──────────────────────────────────────────────────
const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'home-manifest.json');
const globalUrls = new Set();

console.log(`Building global URL index from ${allFiles.length} destination files...`);
allFiles.forEach(f => {
  const content = fs.readFileSync(path.join(DEST_DIR, f), 'utf8');
  const urls = content.match(/https?:\/\/[^"'\s,]+/g) || [];
  urls.forEach(u => globalUrls.add(u.split('?')[0]));
});
console.log(`Indexed ${globalUrls.size} unique photo base URLs.\n`);

// ─── Helpers ────────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsGet(options) {
  return new Promise((resolve) => {
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

function isPersonPhoto(text) {
  return /\bperson\b|\bwoman\b|\bman\b|\bgirl\b|\bboy\b|\bportrait\b|\bmodel\b|\bselfie\b|\bcrowd\b|\bface\b|\bpeople\b/i.test(text || '');
}

async function searchPexelsAll(query) {
  const json = await httpsGet({
    hostname: 'api.pexels.com',
    path: `/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=30`,
    headers: { 'Authorization': PEXELS_KEY }
  });
  if (!json || !json.photos) return [];
  return json.photos.filter(p => {
    const cleanOrig = p.src.original.split('?')[0];
    const cleanLarge = p.src.large2x.split('?')[0];
    return !globalUrls.has(cleanOrig) && !globalUrls.has(cleanLarge) &&
           p.width > p.height && !isPersonPhoto(p.alt);
  });
}

async function searchUnsplashAll(query) {
  const json = await httpsGet({
    hostname: 'api.unsplash.com',
    path: `/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=30`,
    headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` }
  });
  if (!json || !json.results) return [];
  return json.results.filter(p => {
    const clean = p.urls.raw.split('?')[0];
    return !globalUrls.has(clean) && p.width > p.height &&
           !isPersonPhoto(`${p.description} ${p.alt_description}`);
  });
}

function pexelsUrl(p) { return `${p.src.large2x.split('?')[0]}?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`; }
function unsplashUrl(u) { return `${u.urls.raw.split('?')[0]}&auto=format&fit=crop&w=1920&q=85`; }
function registerUrl(url) { globalUrls.add(url.split('?')[0]); }

function getUrlFromField(field) {
  if (!field) return null;
  if (typeof field === 'string') return field;
  if (field.src) return field.src;
  return null;
}

// ─── Scan files for internal duplicates AND remaining Pixabay URLs ─────────────
console.log('Scanning for internal duplicate URLs and remaining Pixabay violations...\n');
const affectedFiles = [];

allFiles.forEach(fname => {
  const fpath = path.join(DEST_DIR, fname);
  const raw = fs.readFileSync(fpath, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch { return; }

  const topPlaces = data.topPlaces || data.places || [];
  const violations = [];
  const seenUrlsInFile = new Set();

  // First pass: collect all existing valid (non-Pixabay) topPlace URLs to seed seenUrlsInFile
  topPlaces.forEach(place => {
    const imgUrl = getUrlFromField(place.image);
    if (imgUrl && !PIXABAY_PATTERN.test(imgUrl)) seenUrlsInFile.add(imgUrl.split('?')[0]);
    (place.photos || []).forEach(ph => {
      const u = getUrlFromField(ph);
      if (u && !PIXABAY_PATTERN.test(u)) seenUrlsInFile.add(u.split('?')[0]);
    });
  });

  // Second pass: detect violations (Pixabay OR internal dupes)
  topPlaces.forEach((place, pi) => {
    const imgUrl = getUrlFromField(place.image);
    if (imgUrl) {
      const cleanImg = imgUrl.split('?')[0];
      const isPixabay = PIXABAY_PATTERN.test(imgUrl);
      const isDupe = !isPixabay && seenUrlsInFile.has(cleanImg);
      // (Don't flag the first occurrence of a clean URL as dupe; only flag Pixabay and subsequent dupes)
      // For image field: check Pixabay or if this same URL appears more than once across topPlaces
      const urlCount = topPlaces.reduce((cnt, p) => {
        const u = getUrlFromField(p.image);
        return cnt + (u && u.split('?')[0] === cleanImg ? 1 : 0) +
               (p.photos || []).filter(ph => {
                 const pu = getUrlFromField(ph);
                 return pu && pu.split('?')[0] === cleanImg;
               }).length;
      }, 0);

      if (isPixabay || urlCount > 1) {
        violations.push({ path: `topPlaces[${pi}].image`, fieldType: 'image', placeIdx: pi, photoIdx: null, placeName: place.name || `Place ${pi}`, url: imgUrl, reason: isPixabay ? 'pixabay' : 'internal-dupe' });
      }
    }

    (place.photos || []).forEach((ph, phi) => {
      const photoUrl = getUrlFromField(ph);
      if (photoUrl) {
        const cleanPh = photoUrl.split('?')[0];
        const isPixabay = PIXABAY_PATTERN.test(photoUrl);
        const urlCount = topPlaces.reduce((cnt, p) => {
          const iu = getUrlFromField(p.image);
          return cnt + (iu && iu.split('?')[0] === cleanPh ? 1 : 0) +
                 (p.photos || []).filter(xph => {
                   const xu = getUrlFromField(xph);
                   return xu && xu.split('?')[0] === cleanPh;
                 }).length;
        }, 0);

        if (isPixabay || urlCount > 1) {
          violations.push({ path: `topPlaces[${pi}].photos[${phi}]`, fieldType: 'photo', placeIdx: pi, photoIdx: phi, placeName: place.name || `Place ${pi}`, url: photoUrl, reason: isPixabay ? 'pixabay' : 'internal-dupe' });
        }
      }
    });
  });

  if (violations.length > 0) {
    affectedFiles.push({ fname, fpath, data, violations, topPlaces });
  }
});

const totalViolations = affectedFiles.reduce((s, f) => s + f.violations.length, 0);
console.log(`Found ${affectedFiles.length} files with issues (${totalViolations} total violations).`);

// ─── Fix ────────────────────────────────────────────────────────────────────────
async function fixFile({ fname, fpath, data, violations, topPlaces }) {
  const destName = data.name || data.title || fname.replace('.json', '').replace(/-/g, ' ');
  const destState = data.state || '';
  console.log(`\n📁 ${fname} (${violations.length} issues)`);

  // Build pool of replacement candidates for this file
  async function getPool(query) {
    let pool = [];
    await delay(DELAY_MS);
    const pex = await searchPexelsAll(query);
    pool = pool.concat(pex.map(p => ({ url: pexelsUrl(p), src: 'pexels' })));
    if (pool.length < 10) {
      await delay(DELAY_MS);
      const un = await searchUnsplashAll(query);
      pool = pool.concat(un.map(u => ({ url: unsplashUrl(u), src: 'unsplash' })));
    }
    return pool;
  }

  // Group violations by place for targeted search
  const byPlace = {};
  violations.forEach(v => {
    if (!byPlace[v.placeIdx]) byPlace[v.placeIdx] = { placeName: v.placeName, violations: [] };
    byPlace[v.placeIdx].violations.push(v);
  });

  let changed = false;
  for (const [idxStr, { placeName, violations: pvs }] of Object.entries(byPlace)) {
    const placeIdx = parseInt(idxStr);
    const place = topPlaces[placeIdx];
    const needed = pvs.length;

    const specificQ = `${placeName} ${destName} ${destState} India`.replace(/\s+/g, ' ').trim();
    let pool = await getPool(specificQ);

    if (pool.length < needed) {
      const fallQ = `${destName} ${destState} India heritage landmark tourism`.replace(/\s+/g, ' ').trim();
      pool = pool.concat(await getPool(fallQ));
    }
    if (pool.length < needed && destState) {
      pool = pool.concat(await getPool(`${destState} India architecture nature landscape`));
    }
    if (pool.length < needed) {
      pool = pool.concat(await getPool('India heritage temple landmark scenic'));
    }

    // Remove duplicates from pool itself
    const poolSeen = new Set();
    pool = pool.filter(r => {
      const clean = r.url.split('?')[0];
      if (poolSeen.has(clean)) return false;
      poolSeen.add(clean);
      return true;
    });

    for (let i = 0; i < pvs.length; i++) {
      const v = pvs[i];
      const replacement = pool[i];
      if (!replacement) {
        console.log(`    ⚠️  No replacement for ${v.path} [${v.reason}]`);
        continue;
      }
      registerUrl(replacement.url);
      if (v.fieldType === 'image') {
        if (typeof place.image === 'object') place.image.src = replacement.url;
        else place.image = replacement.url;
      } else {
        place.photos[v.photoIdx] = replacement.url;
      }
      changed = true;
      console.log(`    ✅ [${replacement.src}] ${v.path} [${v.reason}] → ${replacement.url.substring(0, 75)}...`);
    }
  }

  if (changed && !DRY_RUN) {
    fs.writeFileSync(fpath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`  💾 Saved.`);
  } else if (DRY_RUN) {
    console.log(`  🔍 [DRY RUN]`);
  }
  return changed;
}

(async () => {
  const toFix = affectedFiles.slice(0, LIMIT);
  console.log(`\nProcessing ${toFix.length} files${LIMIT < Infinity ? ` (limit: ${LIMIT})` : ''}...`);
  if (DRY_RUN) console.log('🔍 DRY RUN - no writes\n');

  let fixed = 0, failed = 0;
  for (const f of toFix) {
    try { if (await fixFile(f)) fixed++; }
    catch (e) { console.error(`❌ ${f.fname}: ${e.message}`); failed++; }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Fixed: ${fixed} | ❌ Failed: ${failed} | Total: ${toFix.length}`);
  console.log(`Run 'node scripts/deep_pre_commit_audit.js' to verify.`);
})();
