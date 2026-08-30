const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const destFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

const DEFECT_PATTERNS = [
  { name: 'AUDIO_VIDEO', reg: /\.(ogg|ogv|oga|webm|mp4|avi|mov|flv|mp3|wav|mid|midi)([\/?#]|$)/i },
  { name: 'PDF_DJVU', reg: /\.(pdf|djvu)([\/?#]|$)/i },
  { name: 'SVG_FILE', reg: /\.svg([\/?#]|$)/i },
  { name: 'PLACEHOLDER', reg: /(picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr|placeholder\.com|fakeimg)/i },
  { name: 'FLAG_LOGO_MAP', reg: /(flag_of_|coat_of_arms|logo_of_|seal_of_|emblem_of_|symbol_of_|india_location_map|location_map|map_of_|locator_map|administrative_map|political_map|outline_map|blank_map)/i },
  { name: 'DIAGRAM_CHART', reg: /(diagram|schematic|census|chart_|graph_|table_|statistics|pie_chart|bar_chart|infographic)/i },
  { name: 'STAMP_COIN', reg: /(stamp_of_|postage_stamp|coin_of_|banknote|currency_note|copper_coin|silver_coin|1_pice|jital_coin)/i },
  { name: 'ICON_CLIPART', reg: /(icon[_\-]|pictogram|emoji|clipart|holy_icon|\.ico([\/?#]|$))/i },
  { name: 'PORTRAIT_PERSON', reg: /(portrait_of_|headshot|selfie|passport_photo|mugshot|lissa_lauria)/i }
];

let totalImageSlots = 0;
let totalDefectsFound = 0;
const defectsBreakdown = {};

const globalUrlToDestinations = new Map(); // cleanUrl -> [ { file, field } ]
let intraDestCollisionsCount = 0;
let crossDestCollisionsCount = 0;
let heroGallery0MismatchCount = 0;

const cleanUrl = u => (u || '').split('?')[0].toLowerCase();

destFiles.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  const heroUrl = d.heroImage?.src || (typeof d.heroImage === 'string' ? d.heroImage : '');
  const g0Url = d.gallery?.[0]?.src || (typeof d.gallery?.[0] === 'string' ? d.gallery[0] : '');

  if (heroUrl && g0Url && heroUrl !== g0Url) {
    heroGallery0MismatchCount++;
  }

  // Extract all images in this destination
  const images = []; // { field, url }
  if (heroUrl) images.push({ field: 'heroImage', url: heroUrl });
  (d.gallery || []).forEach((g, idx) => {
    const u = g?.src || (typeof g === 'string' ? g : '');
    if (u) images.push({ field: `gallery[${idx}]`, url: u });
  });
  (d.topPlaces || []).forEach((p, pIdx) => {
    const pImg = p?.image?.src || (typeof p?.image === 'string' ? p.image : '');
    if (pImg) images.push({ field: `topPlaces[${pIdx}].image`, url: pImg });
    (p.photos || []).forEach((ph, phIdx) => {
      const phImg = ph?.src || (typeof ph === 'string' ? ph : '');
      if (phImg) images.push({ field: `topPlaces[${pIdx}].photos[${phIdx}]`, url: phImg });
    });
  });

  // Check defects
  images.forEach(img => {
    totalImageSlots++;
    for (const p of DEFECT_PATTERNS) {
      if (p.reg.test(img.url)) {
        totalDefectsFound++;
        defectsBreakdown[p.name] = (defectsBreakdown[p.name] || 0) + 1;
        break;
      }
    }
  });

  // Check intra-destination duplicates (excluding the deliberate hero == gallery[0] mirror)
  const localSeen = new Map();
  images.forEach(img => {
    if (img.field === 'gallery[0]' && localSeen.has(cleanUrl(img.url))) {
      // Expected mirror of hero
      return;
    }
    const cu = cleanUrl(img.url);
    if (localSeen.has(cu)) {
      intraDestCollisionsCount++;
    } else {
      localSeen.set(cu, img.field);
    }
  });

  // Cross-destination tracking
  const distinctUrlsInThisDest = new Set(images.map(i => cleanUrl(i.url)));
  distinctUrlsInThisDest.forEach(cu => {
    if (!globalUrlToDestinations.has(cu)) globalUrlToDestinations.set(cu, []);
    globalUrlToDestinations.get(cu).push(file);
  });
});

// Calculate cross-destination collisions
for (const [cu, filesList] of globalUrlToDestinations.entries()) {
  if (filesList.length > 1) {
    crossDestCollisionsCount++;
  }
}

console.log('======================================================================');
console.log('         FINAL QUALITY & REPOSITORY HEALTH VERIFICATION REPORT         ');
console.log('======================================================================');
console.log(`📁 Total Destinations Analyzed:             ${destFiles.length.toLocaleString()}`);
console.log(`🖼️  Total Image Slots Audited:               ${totalImageSlots.toLocaleString()}`);
console.log(`🔑 Total Unique Images in Global Pool:      ${globalUrlToDestinations.size.toLocaleString()}`);
console.log('----------------------------------------------------------------------');
console.log(`🚨 Defective / Improper Images Remaining:   ${totalDefectsFound}`);
console.log(`🚨 Cross-Destination Duplicate Images:      ${crossDestCollisionsCount}`);
console.log(`🚨 Intra-Destination Disjoint Collisions:   ${intraDestCollisionsCount}`);
console.log(`🎯 Hero Image vs Gallery[0] Consistency:    ${heroGallery0MismatchCount === 0 ? '100% Perfect (0 mismatches)' : heroGallery0MismatchCount + ' mismatches'}`);
console.log('======================================================================\n');
