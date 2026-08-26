/**
 * sync-bulk-from-destinations.js
 * 
 * Synchronizes and backports clean canonical data from data/destinations/<slug>.json
 * into data/bulk/*.json (all 36 state files).
 * 
 * This breaks the "re-infection loop" permanently so that running build scripts
 * will never overwrite clean destination files with old picsum or PDF scans.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const BULK_DIR = path.join(ROOT, 'data', 'bulk');

const PDF_DJVU_PATTERN = /\.(pdf|djvu|doc|txt)(\/page|\.jpg|\.png)?/i;
const VIDEO_AUDIO_PATTERN = /\.(webm|ogv|mp4|avi|mov|flv|mp3|wav|mid|midi)(\/|\.jpg|\.png)?/i;
const LOGO_FLAG_MAP_PATTERN = /(flag_of|coat_of_arms|logo_of|map_of|diagram|chart|census|stamp_of|location_map|seal_of|symbol_of)/i;
const PLACEHOLDER_PATTERN = /(picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr)/i;
const BLURRY_THUMB_PATTERN = /\/([1-9][0-9]|1[0-9][0-9]|200)px-/i;

function isBadUrl(url) {
  if (!url || typeof url !== 'string') return true;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('images/')) return true;
  if (PDF_DJVU_PATTERN.test(url)) return true;
  if (VIDEO_AUDIO_PATTERN.test(url)) return true;
  if (LOGO_FLAG_MAP_PATTERN.test(url)) return true;
  if (PLACEHOLDER_PATTERN.test(url)) return true;
  if (BLURRY_THUMB_PATTERN.test(url)) return true;
  return false;
}

function syncBulkFiles() {
  const bulkFiles = fs.readdirSync(BULK_DIR).filter(f => f.endsWith('.json'));
  console.log(`Synchronizing ${bulkFiles.length} state bulk files from data/destinations/...`);

  let totalDestsSynced = 0;
  let totalPlacesSynced = 0;
  let totalStaysSynced = 0;

  for (const file of bulkFiles) {
    const bulkPath = path.join(BULK_DIR, file);
    const stateDests = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));

    for (const d of stateDests) {
      const destPath = path.join(DEST_DIR, `${d.id}.json`);
      if (!fs.existsSync(destPath)) continue;

      const clean = JSON.parse(fs.readFileSync(destPath, 'utf8'));
      const heroSrc = (clean.heroImage && clean.heroImage.src) || (clean.image && clean.image.src) || d.heroImage;

      // Sync top-level destination images
      d.image = heroSrc;
      d.heroImage = heroSrc;
      d.photos = (clean.gallery || []).map(g => (g && g.src) || g).filter(src => !isBadUrl(src));
      if (d.photos.length === 0) d.photos = [heroSrc];

      // Sync places
      if (Array.isArray(d.places) && Array.isArray(clean.topPlaces)) {
        d.places.forEach((p, idx) => {
          // Find matching place by name or index
          const cleanPlace = clean.topPlaces.find(cp => cp.name.toLowerCase() === p.name.toLowerCase()) || clean.topPlaces[idx];
          if (cleanPlace) {
            const pSrc = (cleanPlace.image && cleanPlace.image.src) || (typeof cleanPlace.image === 'string' ? cleanPlace.image : null) || heroSrc;
            p.image = pSrc;
            p.photos = (cleanPlace.photos || []).filter(src => !isBadUrl(src));
            if (p.photos.length === 0) p.photos = [pSrc];
            totalPlacesSynced++;
          }
        });
      }

      // Sync stays / hotels
      if (Array.isArray(d.stays) && Array.isArray(clean.hotels)) {
        d.stays.forEach((s, idx) => {
          const cleanHotel = clean.hotels.find(ch => ch.name.toLowerCase() === s.name.toLowerCase()) || clean.hotels[idx];
          if (cleanHotel) {
            const hSrc = (cleanHotel.image && cleanHotel.image.src) || (typeof cleanHotel.image === 'string' ? cleanHotel.image : null) || heroSrc;
            s.image = hSrc;
            totalStaysSynced++;
          }
        });
      }

      totalDestsSynced++;
    }

    fs.writeFileSync(bulkPath, JSON.stringify(stateDests, null, 2));
  }

  console.log(`\n=== BULK SYNC COMPLETED ===`);
  console.log(`Total bulk destinations updated: ${totalDestsSynced}`);
  console.log(`Total places synchronized: ${totalPlacesSynced}`);
  console.log(`Total stays synchronized: ${totalStaysSynced}`);
}

syncBulkFiles();
