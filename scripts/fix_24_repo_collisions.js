/**
 * scripts/fix_24_repo_collisions.js
 */

const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const envPath = path.resolve(__dirname, '..', '.env.local');

const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
}

const TARGETS = [
  'veerbhadra-temple',
  'panchakuta-basadi-kambadahalli',
  'siddhesvara-temple',
  'mogalrajapuram-caves',
  'sakshinatheswarar-temple-thiruppurambiyam',
  'nanda-devi-national-park',
  'madikeri-fort'
];

function clean(u) {
  if (!u) return '';
  if (typeof u === 'object') u = u.src || '';
  return u.split('?')[0].trim().toLowerCase();
}

const blockedUrls = new Set();
fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'home-manifest.json').forEach(f => {
  const s = f.replace('.json', '');
  if (!TARGETS.includes(s)) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
      if (d.heroImage?.src) blockedUrls.add(clean(d.heroImage.src));
      if (d.gallery) d.gallery.forEach(g => blockedUrls.add(clean(g.src)));
      if (d.topPlaces) d.topPlaces.forEach(p => {
        blockedUrls.add(clean(p.image));
        if (p.photos) p.photos.forEach(ph => blockedUrls.add(clean(ph)));
      });
    } catch(e) {}
  }
});

console.log('Blocked repository URLs:', blockedUrls.size);

const targetUsedUrls = new Set();
const all19 = [
  'thirparappu-waterfalls', 'someshwara-temple-marathahalli', 'vazhappally-maha-siva-temple',
  'tapkeshwar-temple', 'sessa-orchid-sanctuary', 'veerbhadra-temple',
  'panchakuta-basadi-kambadahalli', 'siddhesvara-temple', 'vardhangad-fort',
  'mogalrajapuram-caves', 'sakshinatheswarar-temple-thiruppurambiyam',
  'tungabhadra-otter-conservation-reserve', 'nanda-devi-national-park',
  'madikeri-fort', 'gagron-fort', 'bibhutibhushan-wildlife-sanctuary',
  'sinhagad', 'noida', 'gurugram'
];

for (const slug of all19) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(destDir, slug + '.json'), 'utf8'));
    if (d.gallery) d.gallery.forEach(g => targetUsedUrls.add(clean(g.src)));
    if (d.topPlaces) d.topPlaces.forEach(p => {
      targetUsedUrls.add(clean(p.image));
      if (p.photos) p.photos.forEach(ph => targetUsedUrls.add(clean(ph)));
    });
  } catch(e) {}
}

async function verifyLive(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'ExploreDesh/1.0', 'Range': 'bytes=0-1024' },
      signal: AbortSignal.timeout(3500)
    });
    return res.status >= 200 && res.status < 400;
  } catch(e) {
    return false;
  }
}

async function getFreshCandidate(queries) {
  for (const query of queries) {
    for (let page = 1; page <= 4; page++) {
      // 1. Unsplash
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`;
        const res = await fetch(url, { headers: { Authorization: 'Client-ID ' + env.UNSPLASH_ACCESS_KEY }, signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          for (const r of (data.results || [])) {
            const u = `${r.urls.raw}&auto=format&fit=crop&w=1920&q=80`;
            const k = clean(u);
            if (!blockedUrls.has(k) && !targetUsedUrls.has(k)) {
              const live = await verifyLive(u);
              if (live) {
                targetUsedUrls.add(k);
                return u;
              }
            }
          }
        }
      } catch(e) {}

      // 2. Pexels
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`;
        const res = await fetch(url, { headers: { Authorization: env.PEXELS_API_KEY }, signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          for (const p of (data.photos || [])) {
            const u = p.src.large2x || p.src.original;
            const k = clean(u);
            if (!blockedUrls.has(k) && !targetUsedUrls.has(k)) {
              const live = await verifyLive(u);
              if (live) {
                targetUsedUrls.add(k);
                return u;
              }
            }
          }
        }
      } catch(e) {}

      // 3. Wikimedia HD
      try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|size&format=json`;
        const res = await fetch(url, { headers: { 'User-Agent': 'ExploreDesh/1.0 (https://exploredesh.org; contact@exploredesh.org)' }, signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          for (const p of Object.values(data.query?.pages || {})) {
            const ii = p.imageinfo?.[0];
            if (!ii || !ii.url || ii.width < 1200 || ii.width <= ii.height) continue;
            const u = ii.url.split('?')[0];
            const k = clean(u);
            if (!blockedUrls.has(k) && !targetUsedUrls.has(k)) {
              const live = await verifyLive(u);
              if (live) {
                targetUsedUrls.add(k);
                return u;
              }
            }
          }
        }
      } catch(e) {}
    }
  }

  throw new Error(`Failed to find fresh candidate for queries: ${queries.join(', ')}`);
}

async function fixAllCollisions() {
  let fixedCount = 0;

  for (const slug of TARGETS) {
    const filePath = path.join(destDir, slug + '.json');
    const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    // Check gallery
    if (dest.gallery) {
      for (let i = 0; i < dest.gallery.length; i++) {
        const k = clean(dest.gallery[i].src);
        if (blockedUrls.has(k)) {
          console.log(`Replacing colliding gallery[${i}] in ${slug}: ${k}`);
          const fresh = await getFreshCandidate([
            `${dest.title} ${dest.state || ''}`,
            `${dest.title} vista`,
            `${dest.state || 'India'} scenic landscape`,
            'India incredible landscape nature',
            'South India temple architecture'
          ]);
          dest.gallery[i].src = fresh;
          if (i === 0) dest.heroImage.src = fresh;
          modified = true;
          fixedCount++;
        }
      }
    }

    // Check topPlaces
    if (dest.topPlaces) {
      for (let pIdx = 0; pIdx < dest.topPlaces.length; pIdx++) {
        const pl = dest.topPlaces[pIdx];
        const thumbKey = clean(pl.image);
        if (blockedUrls.has(thumbKey)) {
          console.log(`Replacing colliding place.image in ${slug} [${pl.name}]: ${thumbKey}`);
          const fresh = await getFreshCandidate([
            `${pl.name} ${dest.state || ''}`,
            `${dest.title} architecture`,
            `${dest.state || 'India'} heritage temple`,
            'India travel ancient architecture',
            'Karnataka temple heritage'
          ]);
          pl.image = fresh;
          modified = true;
          fixedCount++;
        }

        if (pl.photos) {
          for (let phIdx = 0; phIdx < pl.photos.length; phIdx++) {
            const phKey = clean(pl.photos[phIdx]);
            if (blockedUrls.has(phKey)) {
              console.log(`Replacing colliding place.photos[${phIdx}] in ${slug} [${pl.name}]: ${phKey}`);
              const fresh = await getFreshCandidate([
                `${dest.title} view ${phIdx + 1}`,
                `${dest.state || 'India'} nature hills`,
                `${dest.state || 'India'} historic architecture`,
                'India historic destination vista',
                'India scenic nature travel'
              ]);
              pl.photos[phIdx] = fresh;
              modified = true;
              fixedCount++;
            }
          }
        }
      }
    }

    if (modified) {
      dest.updatedAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
      console.log(`✔ Repaired and saved: ${slug}.json`);
    }
  }

  console.log(`\nAll done! Successfully replaced ${fixedCount} colliding URLs with 100% unique photos.`);
}

fixAllCollisions().catch(console.error);
