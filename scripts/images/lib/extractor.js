/**
 * Extracts all image references from destination JSON files
 * Handles: heroImage, image, gallery[], topPlaces[].image, topPlaces[].photos[], hotels[].image
 */

const fs = require('fs');
const path = require('path');

// Root is the project root (three levels up from scripts/images/lib/)
const ROOT = path.join(__dirname, '..', '..', '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

/**
 * Extract all image references from a destination detail JSON
 * @param {Object} detail - Full destination detail object
 * @param {string} destSlug - Destination slug
 * @returns {Array} Array of { destSlug, fieldPath, url, name, type }
 */
function extractImagesFromDetail(detail, destSlug) {
  const images = [];

  // Helper to add an image entry
  const add = (fieldPath, url, name, type) => {
    if (!url || typeof url !== 'string') return;
    images.push({ destSlug, fieldPath, url: url.trim(), name, type });
  };

  // Helper to extract string url
  const getUrl = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object' && val.src && typeof val.src === 'string') return val.src.trim();
    return null;
  };

  // heroImage
  const heroUrl = getUrl(detail.heroImage);
  if (heroUrl) {
    add('heroImage', heroUrl, detail.title, 'hero');
  }

  // image (legacy/compat)
  const imgUrl = getUrl(detail.image);
  if (imgUrl) {
    add('image', imgUrl, detail.title, 'image');
  }

  // gallery[]
  if (Array.isArray(detail.gallery)) {
    detail.gallery.forEach((g, idx) => {
      const gUrl = getUrl(g);
      if (gUrl) add(`gallery[${idx}]`, gUrl, detail.title, 'gallery');
    });
  }

  // topPlaces[].image + .photos[]
  if (Array.isArray(detail.topPlaces)) {
    detail.topPlaces.forEach((place, pIdx) => {
      const placeImgUrl = getUrl(place.image);
      if (placeImgUrl) {
        add(`topPlaces[${pIdx}].image`, placeImgUrl, place.name, 'place');
      }
      if (Array.isArray(place.photos)) {
        place.photos.forEach((ph, phIdx) => {
          const phUrl = getUrl(ph);
          if (phUrl) {
            add(`topPlaces[${pIdx}].photos[${phIdx}]`, phUrl, place.name, 'place-photo');
          }
        });
      }
    });
  }

  // hotels[].image
  if (Array.isArray(detail.hotels)) {
    detail.hotels.forEach((hotel, hIdx) => {
      const hotelImgUrl = getUrl(hotel.image);
      if (hotelImgUrl) {
        add(`hotels[${hIdx}].image`, hotelImgUrl, hotel.name, 'hotel');
      }
    });
  }

  return images;
}

/**
 * Load all image references from all destinations
 * @param {Object} options - { limit, state, destination, types }
 * @returns {Promise<Array>} All image entries
 */
async function loadAllImages(options = {}) {
  const { limit, state, destination, types } = options;

  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  let destinations = indexData.destinations || [];

  // Filter by state
  if (state) {
    destinations = destinations.filter(d => d.state === state);
  }

  // Filter by specific destination slug
  if (destination) {
    destinations = destinations.filter(d => d.slug === destination);
  }

  // Filter by type
  if (types && Array.isArray(types) && types.length) {
    destinations = destinations.filter(d => types.includes(d.type));
  }

  // Apply limit
  if (limit && limit > 0) {
    destinations = destinations.slice(0, limit);
  }

  console.log(`Loading images from ${destinations.length} destinations...`);

  const allImages = [];

  for (const dest of destinations) {
    const file = path.join(DEST_DIR, `${dest.slug}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`Missing detail file: ${dest.slug}`);
      continue;
    }

    const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
    const images = extractImagesFromDetail(detail, dest.slug);
    allImages.push(...images);
  }

  console.log(`Total image references found: ${allImages.length}`);
  return allImages;
}

/**
 * Get destination metadata for an image entry
 */
function getDestMeta(destSlug) {
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  return indexData.destinations.find(d => d.slug === destSlug) || null;
}

module.exports = {
  extractImagesFromDetail,
  loadAllImages,
  getDestMeta,
  ROOT,
  DEST_DIR,
  INDEX_PATH,
};