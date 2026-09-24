// scripts/deep_check_all_19_cards_and_places.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const TARGET_SLUGS = [
  'thirparappu-waterfalls',
  'someshwara-temple-marathahalli',
  'vazhappally-maha-siva-temple',
  'tapkeshwar-temple',
  'sessa-orchid-sanctuary',
  'veerbhadra-temple',
  'panchakuta-basadi-kambadahalli',
  'siddhesvara-temple',
  'vardhangad-fort',
  'mogalrajapuram-caves',
  'sakshinatheswarar-temple-thiruppurambiyam',
  'tungabhadra-otter-conservation-reserve',
  'nanda-devi-national-park',
  'madikeri-fort',
  'gagron-fort',
  'bibhutibhushan-wildlife-sanctuary',
  'sinhagad',
  'noida',
  'gurugram'
];

function optimizeImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('https://wsrv.nl') || url.startsWith('//wsrv.nl')) {
    try {
      const u = new URL(url.startsWith('//') ? 'https:' + url : url);
      const inner = u.searchParams.get('url');
      if (inner) return optimizeImageUrl(decodeURIComponent(inner), width);
    } catch (_) {}
  }
  if (url.includes('/thumb/') && /\/\d+px-[^/]+$/.test(url)) {
    return url.replace(/\/(\d+)px-([^/]+)$/, '/' + width + 'px-$2');
  }
  if (url.includes('upload.wikimedia.org/wikipedia/commons/') && !url.includes('/thumb/') && !url.endsWith('.svg')) {
    const filename = url.split('/').pop().split('?')[0];
    return 'https://commons.wikimedia.org/w/thumb.php?f=' + filename + '&w=' + width;
  }
  if (url.includes('images.pexels.com/photos/')) {
    try {
      const u = new URL(url);
      u.searchParams.delete('dpr');
      u.searchParams.delete('h');
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      u.searchParams.set('w', String(Math.min(width, 1920)));
      return u.toString();
    } catch (_) {
      return url;
    }
  }
  return url;
}

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const client = u.protocol === 'https:' ? https : http;
      const req = client.request(u, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        timeout: 7000
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ ok: true, status: res.statusCode });
        } else if (res.statusCode === 403 || res.statusCode === 405) {
          // Some CDNs block HEAD requests with 403/405; test GET with Range
          const getReq = client.request(u, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Range': 'bytes=0-1024'
            },
            timeout: 7000
          }, (getRes) => {
            getRes.destroy();
            resolve({ ok: getRes.statusCode >= 200 && getRes.statusCode < 400, status: getRes.statusCode });
          });
          getReq.on('error', () => resolve({ ok: false, error: 'GET error' }));
          getReq.on('timeout', () => { getReq.destroy(); resolve({ ok: false, error: 'GET timeout' }); });
          getReq.end();
        } else {
          resolve({ ok: false, status: res.statusCode });
        }
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'HEAD timeout' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

async function runAudit() {
  console.log('='.repeat(80));
  console.log('DEEP CHECK: ALL 19 DESTINATIONS - CARDS & PLACES IMAGE AUDIT');
  console.log('='.repeat(80));

  let totalPlacesChecked = 0;
  let totalPlacesWithImage = 0;
  let totalPlacesWithPhotos = 0;
  let totalCardsPassed = 0;
  let totalCardsFailed = 0;
  const destinationReports = [];

  for (const slug of TARGET_SLUGS) {
    const fPath = path.join(ROOT, 'data', 'destinations', `${slug}.json`);
    if (!fs.existsSync(fPath)) {
      console.error(`MISSING FILE: ${fPath}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(fPath, 'utf8'));
    const places = data.topPlaces || data.places || [];
    const heroImage = data.heroImage;
    const gallery = data.gallery || [];

    const destReport = {
      slug,
      title: data.title,
      heroImageSrc: typeof heroImage === 'string' ? heroImage : (heroImage && heroImage.src ? heroImage.src : ''),
      galleryCount: gallery.length,
      placesCount: places.length,
      placesDetails: [],
      issues: []
    };

    if (!destReport.heroImageSrc) {
      destReport.issues.push('Hero image missing or invalid');
    }
    if (gallery.length < 5) {
      destReport.issues.push(`Gallery has only ${gallery.length} images (expected >= 5)`);
    }

    // Check each place
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      totalPlacesChecked++;

      const pImgSrc = typeof p.image === 'string' ? p.image : (p.image && p.image.src ? p.image.src : '');
      const pPhotos = Array.isArray(p.photos) ? p.photos.map(ph => typeof ph === 'string' ? ph : (ph && ph.src ? ph.src : '')) : [];

      const pReport = {
        name: p.name,
        category: p.category,
        imageSrc: pImgSrc,
        photosCount: pPhotos.length,
        hasImage: !!pImgSrc,
        hasPhotos: pPhotos.length >= 3,
        optimizedSrc: optimizeImageUrl(pImgSrc, 600)
      };

      if (pImgSrc) {
        totalPlacesWithImage++;
      } else {
        destReport.issues.push(`Place [${p.name}] missing thumbnail image`);
      }

      if (pPhotos.length >= 3) {
        totalPlacesWithPhotos++;
      } else {
        destReport.issues.push(`Place [${p.name}] has only ${pPhotos.length} photos (expected >= 3)`);
      }

      destReport.placesDetails.push(pReport);
    }

    if (destReport.issues.length === 0) {
      totalCardsPassed++;
    } else {
      totalCardsFailed++;
    }

    destinationReports.push(destReport);
  }

  console.log(`\nRESULTS SUMMARY:`);
  console.log(`- Destinations Checked: ${TARGET_SLUGS.length}`);
  console.log(`- Total Places Audited: ${totalPlacesChecked}`);
  console.log(`- Places with Valid Thumbnail Image: ${totalPlacesWithImage} / ${totalPlacesChecked} (${Math.round(totalPlacesWithImage/totalPlacesChecked*100)}%)`);
  console.log(`- Places with 3+ Modal Photos: ${totalPlacesWithPhotos} / ${totalPlacesChecked} (${Math.round(totalPlacesWithPhotos/totalPlacesChecked*100)}%)`);
  console.log(`- Destinations 100% Passed: ${totalCardsPassed} / ${TARGET_SLUGS.length}`);
  console.log(`- Destinations with Issues: ${totalCardsFailed}`);

  // Table summary
  console.log('\n' + '-'.repeat(80));
  console.log('DESTINATION LEVEL BREAKDOWN:');
  console.log('-'.repeat(80));
  destinationReports.forEach((r, idx) => {
    const status = r.issues.length === 0 ? '✓ PASS' : '✗ FAIL: ' + r.issues.join('; ');
    console.log(`${(idx + 1).toString().padStart(2, ' ')}. [${r.slug}]`);
    console.log(`    Title: ${r.title} | Hero: ${r.heroImageSrc.slice(0, 50)}...`);
    console.log(`    Gallery: ${r.galleryCount} | Places: ${r.placesCount} | Status: ${status}`);
  });

  // Sample check HTTP reachability for places across destinations
  console.log('\n' + '-'.repeat(80));
  console.log('SAMPLE LIVE HTTP REACHABILITY CHECK (First place thumbnail per destination):');
  console.log('-'.repeat(80));
  for (const r of destinationReports) {
    if (r.placesDetails.length > 0) {
      const firstPlace = r.placesDetails[0];
      const opt = firstPlace.optimizedSrc;
      const res = await checkUrl(opt || firstPlace.imageSrc);
      console.log(`  [${r.slug}] Place "${firstPlace.name}": status ${res.status || res.error || 'OK'} -> ${res.ok ? '✓ Reachable' : '✗ Failed'}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('ALL CARDS AND PLACES VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

runAudit();
