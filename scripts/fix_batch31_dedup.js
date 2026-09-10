/**
 * Cross-destination dedup fixer for Batch 31
 * Finds all cross-destination URL collisions and replaces them with fresh unique Pexels URLs
 */

const fs = require('fs');
const https = require('https');

const PEXELS_API_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const UNSPLASH_KEY = 'b5SJtVH8cpSj584Voko6hCJIP8XfBX15M693dDqMh4o';

const TARGETS = [
  'beeramgunta-poleramma-temple',
  'sri-sri-nookambika-ammavari-temple',
  'kotasattemma-temple-nidadavolu',
  'st-joseph-s-syro-malabar-catholic-church-meenkunnam',
  'sacred-heart-forane-church',
  'kottarakkara-sree-mahaganapathi-kshethram',
  'shatrughna-temple',
  'tingmosgang-monastery',
  'karsha-monastery'
];

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = { hostname: opts.hostname, path: opts.pathname + opts.search, method: 'GET', headers: { 'User-Agent': 'ExploreDesh/1.0', ...headers } };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, data: {} }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

let pexelsPage = { default: 1 };

async function fetchFreshPexels(query, globalUsed, count = 5) {
  const results = [];
  let page = pexelsPage[query] || 1;
  while (results.length < count && page <= 10) {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`;
    const res = await httpGet(url, { Authorization: PEXELS_API_KEY });
    page++;
    pexelsPage[query] = page;
    if (res.status !== 200 || !(res.data.photos || []).length) break;
    for (const p of res.data.photos) {
      const src = p.src.large2x || p.src.original;
      if (!globalUsed.has(src) && p.width >= 1280) {
        results.push({ src, alt: p.alt || query });
        globalUsed.add(src);
        if (results.length >= count) break;
      }
    }
  }
  // Try Unsplash if still short
  if (results.length < count) {
    const uUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`;
    const uRes = await httpGet(uUrl, { Authorization: `Client-ID ${UNSPLASH_KEY}` });
    if (uRes.status === 200) {
      for (const p of (uRes.data.results || [])) {
        const src = `${p.urls.raw}&auto=format&fit=crop&w=1280&q=80`;
        if (!globalUsed.has(src) && p.width >= 1280) {
          results.push({ src, alt: p.alt_description || query });
          globalUsed.add(src);
          if (results.length >= count) break;
        }
      }
    }
  }
  return results;
}

async function main() {
  // Build global used set from first destination (no collision) and fix others
  const globalUsed = new Set();
  
  // Load all data
  const allData = {};
  for (const t of TARGETS) {
    allData[t] = JSON.parse(fs.readFileSync(`data/destinations/${t}.json`, 'utf8'));
  }

  // First pass: register all URLs from first dest (beeramgunta) as taken
  const first = TARGETS[0];
  const fd = allData[first];
  const fpl = fd.places || fd.topPlaces || [];
  (fd.gallery||[]).forEach(g => globalUsed.add(g.src));
  fpl.forEach(p => {
    if (p.image && p.image.src) globalUsed.add(p.image.src);
    if (p.cover) globalUsed.add(p.cover);
    (p.photos||[]).forEach(ph => globalUsed.add(ph));
  });
  console.log(`${first}: ${globalUsed.size} URLs registered (baseline)`);

  // For each subsequent destination, find collisions and replace
  for (let i = 1; i < TARGETS.length; i++) {
    const t = TARGETS[i];
    const d = allData[t];
    const places = d.places || d.topPlaces || [];
    let fixCount = 0;

    // Determine state-appropriate fallback queries
    const isKerala = t.includes('church') || t.includes('kottarakkara') || t.includes('shatrughna');
    const isLadakh = t.includes('monastery') || t.includes('tingmosgang') || t.includes('karsha');
    const isAP = t.includes('temple') && !isKerala && !isLadakh;
    
    const fallbackQueries = isLadakh
      ? ['Ladakh Buddhist monastery', 'Zanskar valley Ladakh', 'Himalayan gompa monastery', 'Leh Ladakh mountains', 'Buddhist prayer flags Himalaya']
      : isKerala
        ? ['Kerala temple architecture', 'Kerala landscape nature', 'Kerala church heritage', 'God\'s own country Kerala', 'Kerala tropical scenery']
        : ['Andhra Pradesh temple architecture', 'Telugu temple gopuram', 'South India temple', 'Andhra Pradesh scenic landscape', 'Hindu temple India architecture'];

    // Fix gallery URLs
    for (let gi = 0; gi < (d.gallery||[]).length; gi++) {
      const currentSrc = d.gallery[gi].src;
      if (globalUsed.has(currentSrc)) {
        console.log(`  ${t} gallery[${gi}] COLLISION — replacing...`);
        const q = fallbackQueries[gi % fallbackQueries.length] + ` ${gi}`;
        const fresh = await fetchFreshPexels(q, globalUsed, 1);
        if (fresh.length > 0) {
          d.gallery[gi].src = fresh[0].src;
          d.gallery[gi].alt = fresh[0].alt;
          if (gi === 0) {
            if (d.heroImage) d.heroImage.src = fresh[0].src;
            if (d.seo) d.seo.ogImage = fresh[0].src;
            if (d.image) d.image = fresh[0].src;
          }
          fixCount++;
        }
      } else {
        globalUsed.add(currentSrc);
      }
    }

    // Fix place URLs
    for (let pi = 0; pi < places.length; pi++) {
      const pl = places[pi];
      const plName = pl.name || pl.title || `Place ${pi+1}`;
      
      // Fix cover/image
      const coverSrc = (pl.image && pl.image.src) || pl.cover;
      if (coverSrc && globalUsed.has(coverSrc)) {
        console.log(`  ${t} place[${pi}].cover COLLISION — replacing...`);
        const q = fallbackQueries[pi % fallbackQueries.length];
        const fresh = await fetchFreshPexels(q, globalUsed, 1);
        if (fresh.length > 0) {
          if (pl.image) pl.image = { src: fresh[0].src, alt: fresh[0].alt };
          if (pl.cover !== undefined) pl.cover = fresh[0].src;
          fixCount++;
        }
      } else if (coverSrc) {
        globalUsed.add(coverSrc);
      }

      // Fix photos
      for (let phI = 0; phI < (pl.photos||[]).length; phI++) {
        if (globalUsed.has(pl.photos[phI])) {
          console.log(`  ${t} place[${pi}].photos[${phI}] COLLISION — replacing...`);
          const q = fallbackQueries[(pi + phI) % fallbackQueries.length];
          const fresh = await fetchFreshPexels(q, globalUsed, 1);
          if (fresh.length > 0) {
            pl.photos[phI] = fresh[0].src;
            fixCount++;
          }
        } else {
          globalUsed.add(pl.photos[phI]);
        }
      }
    }

    if (d.places) d.places = places;
    else if (d.topPlaces) d.topPlaces = places;

    fs.writeFileSync(`data/destinations/${t}.json`, JSON.stringify(d, null, 2), 'utf8');
    console.log(`${t}: ${fixCount} collisions fixed. Global pool: ${globalUsed.size} URLs`);
  }

  // Final verification
  console.log('\n=== FINAL VERIFICATION ===');
  const finalGlobal = new Set();
  let allOk = true;
  for (const t of TARGETS) {
    const d = JSON.parse(fs.readFileSync(`data/destinations/${t}.json`, 'utf8'));
    const g = d.gallery || [];
    const places = d.places || d.topPlaces || [];
    const urls = [];
    g.forEach(x => urls.push(x.src));
    places.forEach(p => {
      if (p.image && p.image.src) urls.push(p.image.src);
      if (p.cover) urls.push(p.cover);
      (p.photos||[]).forEach(ph => urls.push(ph));
    });
    const crossDupes = urls.filter(u => finalGlobal.has(u));
    const wikiCount = urls.filter(u => u && u.includes('wikimedia')).length;
    urls.forEach(u => finalGlobal.add(u));
    const status = crossDupes.length === 0 && wikiCount === 0 && g.length === 5 ? '✅' : '❌';
    if (status === '❌') allOk = false;
    console.log(`${status} ${t}: gallery=${g.length} crossDupes=${crossDupes.length} wikimedia=${wikiCount}`);
  }
  console.log(allOk ? '\n✅ All 100% unique, 0 Wikimedia!' : '\n❌ Issues remain — check above');
}

main().catch(console.error);
