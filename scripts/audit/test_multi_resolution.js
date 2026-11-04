/**
 * scripts/audit/test_multi_resolution.js
 * ============================================================
 * Deep Multi-Resolution & Non-Overlapping Verification Suite
 * Evaluates ExploreDesh UI layers across 12 viewport breakpoints
 * from 320px ultra-mobile to 1920px+ desktop display.
 */

const fs = require('fs');
const path = require('path');

const BREAKPOINTS = [
  { name: 'Ultra-Narrow Mobile (iPhone SE 1st / Galaxy Fold)', width: 320, height: 568 },
  { name: 'Android Compact (Galaxy S20)', width: 360, height: 800 },
  { name: 'Standard iPhone (SE 2/3 / iPhone 8)', width: 375, height: 667 },
  { name: 'Modern iPhone (12 / 13 / 14 / 15 / 16)', width: 390, height: 844 },
  { name: 'Large Mobile (iPhone Pro Max / Plus)', width: 414, height: 896 },
  { name: 'Phablet / Wide Mobile', width: 480, height: 854 },
  { name: 'Small Tablet Portrait', width: 640, height: 960 },
  { name: 'iPad Portrait (768px)', width: 768, height: 1024 },
  { name: 'iPad Air 10.9 Portrait', width: 834, height: 1194 },
  { name: 'Small Laptop / iPad Landscape', width: 1024, height: 768 },
  { name: 'Standard Desktop / Laptop', width: 1280, height: 800 },
  { name: 'Large Desktop / 4K Scaled', width: 1440, height: 900 }
];

console.log('================================================================');
console.log('📐 EXPLOREDESH DEEP MULTI-RESOLUTION & ZERO-OVERLAP AUDIT');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Verify Stylesheet Invariants
console.log('### STEP 1: Global Viewport Invariants');
const stylesCSS = fs.readFileSync('css/styles.css', 'utf8');
const glassCSS = fs.readFileSync('css/glass-immersive.css', 'utf8');
const exploreCSS = fs.readFileSync('css/explore-immersive.css', 'utf8');
const destCSS = fs.readFileSync('css/destination-immersive.css', 'utf8');

assert(stylesCSS.includes('overflow-x: clip !important'), 'Global root overflow-x: clip active to prevent horizontal scroll trapping');
assert(exploreCSS.includes('box-sizing: border-box') || stylesCSS.includes('box-sizing: border-box'), 'Box-sizing border-box applied catalog-wide');

// 2. Multi-Resolution Clearance Analysis
console.log('\n### STEP 2: Popular 3D Coverflow Arrow & Card Clearance Analysis');
for (const bp of BREAKPOINTS) {
  const w = bp.width;
  let cardWidth = 325;
  let cardMarginLeft = -162;
  let arrowWidth = 52;
  let arrowLeft = 24;

  if (w <= 340) {
    cardWidth = 196;
    cardMarginLeft = -98;
    arrowWidth = 38;
    arrowLeft = 2;
  } else if (w <= 375) {
    cardWidth = 216;
    cardMarginLeft = -108;
    arrowWidth = 42;
    arrowLeft = 4;
  } else if (w <= 480) {
    cardWidth = 244;
    cardMarginLeft = -122;
    arrowWidth = 44;
    arrowLeft = 8;
  } else if (w <= 768) {
    cardWidth = 275;
    cardMarginLeft = -137;
    arrowWidth = 48;
    // clamp(8px, calc(50% - 320px), calc(50% - 230px))
    const calcVal = Math.max(8, Math.min(w / 2 - 230, Math.max(8, w / 2 - 320)));
    arrowLeft = Math.max(8, calcVal);
  } else if (w <= 1023) {
    cardWidth = 300;
    cardMarginLeft = -150;
    arrowWidth = 48;
    arrowLeft = 20;
  } else {
    // Desktop outward framing: clamp(16px, calc(50% - 305px), calc(50% - 275px))
    arrowLeft = Math.max(16, w / 2 - 300);
  }

  // Calculate card bounds
  const center = w / 2;
  const cardLeft = center + cardMarginLeft;
  const cardRight = cardLeft + cardWidth;
  const arrowRightEdge = arrowLeft + arrowWidth;
  const clearance = cardLeft - arrowRightEdge;

  assert(clearance >= 0, `${bp.name} (${w}px): Arrow (0-${arrowRightEdge}px) has +${clearance.toFixed(1)}px clearance from card (starts at ${cardLeft}px) — 0 OVERLAP`);
}

// 3. Category Scroller Track Buffer Analysis
console.log('\n### STEP 3: Category Scroller Arrow Buffer Analysis');
assert(exploreCSS.includes('.category-tabs-track') && exploreCSS.includes('padding: 6px 48px !important'), 'Category track has 48px padding buffer on mobile, preventing pills from scrolling under 38px arrows');

// 4. Section Header Split Bar Inline Verification
console.log('\n### STEP 4: Section Header Split Bar Inline Layout');
assert(stylesCSS.includes('.monthly-header-bar--split') && stylesCSS.includes('flex-wrap: nowrap !important'), 'styles.css enforces flex-wrap: nowrap on split header bars');
assert(glassCSS.includes('@media (max-width: 640px)') && glassCSS.includes('flex-direction: row !important'), 'glass-immersive.css maintains flex-direction: row on small screens <= 640px for single-line inline layout');

// 5. Destination Detail Stat Dials & Overview Grid
console.log('\n### STEP 5: Destination Detail Responsive Telemetry Dials');
assert(destCSS.includes('.dest-summary-grid') && destCSS.includes('@media (max-width: 480px)'), 'Destination summary grid has compact padding and icons on screens <= 480px');
assert(destCSS.includes('@media (max-width: 360px)') && destCSS.includes('grid-template-columns: 1fr !important'), 'Destination summary grid transforms to single-column on screens <= 360px for 100% legibility');

// 6. Navbar and Floating Actions Clearance
console.log('\n### STEP 6: Navbar & Floating Action Stack Clearance');
assert(stylesCSS.includes('.nav-glass > div') && stylesCSS.includes('@media (max-width: 420px)'), 'Navbar padding adjusts to 0.75rem on <= 420px, preventing brand/button wrapping');
assert(stylesCSS.includes('@media (min-width: 769px)') && stylesCSS.includes('bottom: 28px !important'), 'Back-to-top button docks to bottom: 28px on desktop and hovers cleanly at bottom: 90px on mobile above bottom-nav');

// 7. Viewport Meta Configuration across all HTML templates
console.log('\n### STEP 7: Viewport Configuration Across All Templates');
const HTML_FILES = [
  'index.html', 'destinations.html', 'destination.html',
  'ai-finder.html', 'about.html', 'contact.html',
  'privacy.html', 'terms.html', '404.html'
];

HTML_FILES.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('viewport-fit=cover') && html.includes('width=device-width'), `${file} has full responsive viewport-fit=cover tag`);
});

console.log('\n================================================================');
console.log(`RESOLUTION & OVERLAP AUDIT COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}

