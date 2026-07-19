# Home page redesign — match the mockups

## Goal
Bring the home page in line with the 3 reference mockups. The site already matches
mockup 2 (IndiaExplore) closely: green brand, hero with script "India" accent, category
chips, trending carousel, season cards, stats band, footer. This plan adds the elements
the mockups have that we're **missing**, and polishes the hero.

## What's new

### 1. Interactive "Explore India" map + real-data sidebar  (flagship)
Two-column section (map left, panel right), after Trending — mirrors mockups 1 & 3.
- Build step: `scripts/build-india-map.js` reads downloaded `india_raw.geojson.tmp`
  (35 states, GADM NAME_1), projects lng/lat to an SVG viewBox, simplifies rings, writes
  `data/india-map.js` = `{ viewBox, states:[{name,path}] }`. Names normalized to dataset.
- Component `js/components/indiaMap.js`: inline SVG, each state a focusable button
  (click/hover/keyboard). Select -> right panel shows that state's top destinations from
  `summaries` + count + "View all in <state>" link. Default = most-populous state.
  Reduced-motion aware. Falls back to a state list if the map data fails to load.

### 2. "Best This Month" side rail (real data)
Compact ranked rows (thumb, name, state, rating) from `summaries`, like mockup 3.

### 3. Trust badges row
4 items (Best Price Guarantee / Trusted by 50K+ / 24/7 Support / Secure Bookings),
SVG icons, before the newsletter.

### 4. Hero polish
"10K+ travelers planned trips" social-proof cluster with CSS avatar initials on AI card.

## Files
- New: scripts/build-india-map.js, data/india-map.js (generated), js/components/indiaMap.js
- Edit: index.html, js/pages/home.js, css/styles.css, js/components/icons.js,
  regenerate css/tailwind.css if needed.
- Cleanup: remove india_raw.geojson.tmp after build.

## Verification
- node --check all JS; run build, confirm 35 states with non-empty matched paths.
- Headless Chrome: map renders, default selected, click updates panel, no console errors.
- Screenshot desktop + 375px. Fix prior gaps: card text-gray-400->gray-500, add loading state.

## Out of scope
- No backend / blog CMS. Sidebar uses real destination data. Other pages unchanged.
