const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';

const BAD_URLS = [
  'https://images.unsplash.com/photo-1598863639973-2ef70d436264?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1598863639973-2ef70d436264'
];

async function fetchPexels(query) {
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map(p => p.src && (p.src.large2x || p.src.large || p.src.original)).filter(Boolean);
  } catch (e) {
    return [];
  }
}

async function fix() {
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Scanning ${files.length} destination JSON files...`);

  const pool = await fetchPexels('india travel culture heritage landscape');
  let poolIdx = 0;
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(DEST_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let isModified = false;
    for (const bad of BAD_URLS) {
      if (content.includes(bad)) {
        isModified = true;
        break;
      }
    }

    if (isModified) {
      const d = JSON.parse(content);
      
      const replaceIfBad = (url, destTitle) => {
        if (!url || typeof url !== 'string') return url;
        if (BAD_URLS.some(bad => url.includes(bad))) {
          const replacement = pool[poolIdx % pool.length] || d.heroImage.src;
          poolIdx++;
          return replacement;
        }
        return url;
      };

      if (d.heroImage && BAD_URLS.some(bad => (d.heroImage.src || d.heroImage).includes(bad))) {
        const rep = pool[poolIdx % pool.length];
        poolIdx++;
        d.heroImage = { src: rep, alt: `${d.title}, ${d.state}` };
        if (d.seo) d.seo.ogImage = rep;
      }

      if (Array.isArray(d.gallery)) {
        d.gallery.forEach(g => {
          if (g && g.src) g.src = replaceIfBad(g.src, d.title);
        });
      }

      if (Array.isArray(d.topPlaces)) {
        d.topPlaces.forEach(p => {
          if (p.image && p.image.src) p.image.src = replaceIfBad(p.image.src, d.title);
          if (Array.isArray(p.photos)) {
            p.photos = p.photos.map(ph => replaceIfBad(ph, d.title));
          }
        });
      }

      fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
      fixedCount++;
    }
  }

  console.log(`Replaced bad Unsplash image across ${fixedCount} destination files!`);
}

fix().catch(console.error);
