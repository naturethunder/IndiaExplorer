# 🗺️ ExploreDesh — Roadmap & Plan

The working plan for the project: where it stands, what's next, and what it takes to go
public. Keep this current — it's the single place to see status at a glance.

Last updated: 2026-09-02.

---

## ✅ Done (current state)

- **Phase 13: Taj Mahal Creation, Master Media Baseline Restoration, Zero-Collision Invariants & Card Referrer Resilience (2026-09-02)** — Authored full UNESCO World Heritage destination for Taj Mahal, Agra (`taj-mahal.json`) with 37 authentic 4K/HD photos, expanding total catalog to **2,390 destinations**. Stripped 27,678 duplicate cover entries across the repository, enforcing the strict 1-cover + 3-photo nearby place invariant. Added `referrerpolicy="no-referrer"` across all card templates and HTML document heads, resolving Wikimedia and external CDN 429/403 referrer-blocking. Synchronized `data/destinations/index.json`, `data/search-index.json` (2,390 entries), and `sitemap.xml` (2,447 URLs) with 0 duplicate collisions across 69,398 unique assets.
- **Phase 12: Pure Search-Engine SEO, Schema.org Graph & Contact Streamlining (2026-08-31)** — Comprehensive search optimization across all templates (`index.html`, `destinations.html`, `destination.html`, `ai-finder.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`) and runtime helpers (`js/components/seo.js`). Excluded all social media meta tags (`og:*`, `twitter:*`) for a clean, crawler-focused footprint. Implemented complete Schema.org JSON-LD structured data with Google Sitelinks `SearchAction`, `TouristDestination`, `CollectionPage`, `AboutPage`, `ContactPage`, `BreadcrumbList`, and `FAQPage`. Streamlined `contact.html` by removing Phone section and enhancing Email, Office Location, and Response Time cards. Replaced placeholder social buttons in footer with the brand trust badge (`✨ Complete Catalogue of Bharat`). Regenerated sitemap with 2,394 valid canonical URLs.
- **Phase 11: Comprehensive Quality, True 4K Ultra-HD Landscape Standards & Frontend Gallery Engine Fix (2026-08-30)** — Full-catalog forensic audit across all 2,389 destinations (71,750 image slots, 69,361 unique assets) replacing 185 defective non-scenic slots (22 audio files `.ogg`, 110 site floor plans/diagrams, 26 SVGs, 7 ancient coins/stamps, 10 person portraits/headshots, and 9 state maps) with authentic HD landscape and monument photography. Enforced True 4K / Ultra-HD widescreen landscape dimensions (16:9 / 4:3, up to 5600×3728) with 0 cross-destination duplicate images and 0 intra-destination collisions. Fixed `destination.js` (`get5RealPhotos()`) to prioritize `dest.gallery` first and parse descriptive `.alt`/`.title`/`.caption` attributes in the Overview Highlights Carousel.
- **Phase 10: Complete Map, Diagram & Portrait Elimination, Strict 5-Gallery & 3-Place Photo Quality Standards, and Interactive Google Maps Integration (2026-08-29)** — Full repository audit and repair across all 2,389 destinations removing 100% of map diagrams, floor plans, sketches, route outlines, selfies, human portraits, and author photos. Enforced strict 5 unique HD gallery images and 3 unique photos + 1 cover photo per place across every destination (0 duplicate URLs). Added direct "Open in Google Maps" and "Get Directions" action buttons with dynamic GPS coordinates to the Map tab in `destination.html`. Multi-source photography enriched from Wikimedia Commons, Openverse (Flickr CC-BY, Smithsonian Open Access), and Wikipedia.
- **Phase 9: Complete Image Pipeline Clean, 100% Unique Heroes, Dynamic Shuffling & Hotel Google Search Integration (2026-08-26)** — Permanently eradicated all 16,529 picsum placeholders, 468 PDF/DJVU document scans, 45 video frame files, and non-photo maps across all 2,389 destinations. Enforced 100% unique 1-to-1 high-resolution hero photography across all 2,389 destinations (0 duplicate heroes). Stripped hotel image thumbnails repository-wide and connected every hotel directly to Google Search with live pricing and review links. Hardened `build-json-data.js` to preserve canonical images and eliminate the re-infection loop. Implemented dynamic Fisher-Yates reshuffling on the Home page for Trending, Popular, and Best Hill Stations.
- **Phase 8: Full-Screen Layout Expansion, 11-Category Grid, GSAP Reveal & 2,389 Image Sync (2026-08-26)** — Upgraded `index.html` with a full-screen stretched layout spanning all sections (*Hero, 11-Category Grid, Trending Destinations, Interactive Map, Monthly Highlights, Travel This Season, Popular Destinations, Browse by Budget, Best Hill Stations, Explore More*) with edge-to-edge glass distribution (`flex: 1 1 0`). Synced **2,389 destinations** with authentic high-resolution photography in `data/destinations/index.json`. Fixed sticky category toolbar occlusion and active pill highlighting (`#typeFilter button.active`) with emerald gradient glow on `destinations.html`. Added GSAP `ScrollTrigger` batch row reveal engine in `js/pages/explore.js`. Verified Loktak Lake with 100% unique, zero-duplicate high-res photography across all 6 places (18 place photos).
- **Phase 7: Repository-Wide Multi-Source Image Enrichment & National QA Audit (2026-08-20)** — Enriched **2,240 / 2,389 destinations (93.8%)** and **14,001 nearby attractions** across India with **55,681 verified high-resolution photography assets** from Wikimedia Commons, Pexels, and Unsplash. Enforced **5 gallery photos** per destination and **3 distinct photos** per attraction with **0% global duplicate rate** and 0 generic stock fillers. Created the `node scripts/final-repository-audit.js` suite and updated all 36-state national census reports.

- **Destinations Luxury Editorial Redesign & GSAP Motion System (2026-08-17)** — Redesigned `destinations.html` with GSAP animated stats counter, interactive search & category bar, dark emerald/gold glass design system (`explore-immersive.css`), dynamic Similar Destinations heading and cards with real photo verification, and GSAP scroll parallax triggers across home and destination pages. Added GSAP 3.12.5 + ScrollTrigger to `index.html`, `destinations.html`, and `destination.html` with `prefers-reduced-motion` accessibility support. Fixed destination detail page blank render (`#main` container visibility), repaired `explore.js` EOF duplicate fragment, and safeguarded Similar Destinations card image resolution via `cardImg()`.
- **100% Destination Hero Real Photography (2026-08-03)** — Fixed all 154 remaining picsum hero placeholders with verified real regional/state Wikimedia Commons photography across all 2,389 destinations (**0 picsum cover placeholders remaining**).
- **UI/UX Pro Max Destination Detail Redesign (2026-08-03)** — Upgraded "Top Places to Visit" in `js/pages/destination.js` to full cover-card grid layout with rating badges, category tags, distance, and 2-line descriptions; removed redundant "Underrated Gems Nearby" section and cleaned navbar CTA.
- **Canonical-only destination preservation (2026-08-01)** — `build-json-data.js` now keeps all
  34 destinations outside the legacy/bulk sources (28 hand-added + 6 Delhi-NCR) in both the browse
  manifest and AI Finder index. Added read-only `--check` and non-destructive `--search-only` modes;
  repaired search coverage from 2,361 to all 2,389 destinations without rewriting enriched details.
- **2,389 destinations** across 36 states/UTs (13,991 places, 9,764 stays) — catalog integrity verified.
- **Delhi-NCR regression sweep + AI-Finder repair (2026-08-01)** — normalized 6 Delhi-NCR pages to
  the canonical schema, fixed the Ladakh (UT) 37th-state regression, restored summary lat/lng +
  `meta.months` objects lost in the rebuild, and repaired the structurally-broken `finder.js`
  (AI Trip Finder was throwing on every search). See [AUDIT.md](AUDIT.md) → 2026-08-01 addendum.
- **Real Wikimedia photo fetch pass (2026-08-01)** — closed part of the bulk-photo backlog: an
  initial scripted run added +135 real hero photos, +668 real place photos (concentrated in
  Himalayan states). Surfaced and fixed two pipeline bugs: `build-json-data.js` silently drops
  hand-added destinations not sourced from `js/data*.js`/`data/bulk/` (restored 28 via
  `scripts/restore-handadded-destinations.js` — **still a standing landmine, see P0.5 below**), and
  `data/bulk/delhi-ncr-enriched.json`'s ad-hoc schema broke the generic bulk mapper (moved to
  `data/delhi-ncr-source.json`, rebuilt via `scripts/fix-delhi-ncr-final.js`). See
  [AUDIT.md](AUDIT.md) → 2026-08-01 follow-on.
- **Background agent photo/hotel pass — stopped mid-run, resumable (2026-08-01).** Two background
  agents ran further real-data fetches directly on the output layer (`data/destinations/*.json`,
  never touching `data/bulk/` or `build-json-data.js`) and were deliberately **stopped by user
  request** to cap time/token spend, not because of a failure. Current state (verified, safe to
  resume from): **hero picsum 305/2,389 remaining** (was 506 — session total fixed: 201), **place
  picsum 2,966/13,991 remaining** (was 2,979 — only 13 fixed; place-level retry is low-yield per
  attempt and was intentionally deprioritized), **hotel picsum images 9,298/9,764 remaining** (was
  9,537 — 239 hotels got a real OSM-sourced name + photo), **1,342/2,389 destinations** have a
  `hotelSourceTried` marker (processed by the hotel agent, whether or not Overpass had a result for
  them — safe to skip on a re-run). `validate-filters.js` ✅ 2,389/36 after stopping — no corruption.
  **To resume:** re-run the same two agent briefs (hero-only photo retry via Commons/Wikipedia
  summary API; OSM Overpass hotel-name replacement) — both compute their worklist fresh from disk
  each time, so they will automatically skip everything already fixed and pick up exactly where
  they left off. See [AUDIT.md](AUDIT.md) → "2026-08-01 — stopped, handoff state" for the full brief
  text and constraints (curl not fetch, 400ms Commons pause, never touch `data/bulk/`).
- **Photo/hotel agents resumed and verified (2026-08-01; supersedes the stopped-state bullet above).**
  The photo pass now leaves 154 hero and 2,954 place picsum placeholders. The hotel pass marked all
  2,389 canonical destinations tried, recorded 7,570 OSM-sourced hotel replacements, and leaves
  2,085 exact generated-template names plus 9,150 hotel picsum images. Overpass rate limits left
  60 destinations marked `hotelSourceError: true` as the precise retry set. Both validation scripts
  pass; see [AUDIT.md](AUDIT.md) for commands and constraints.
- **Strict Real Photos Policy (Zero Picsum / Fake Stock Rule)** — Completely eradicated picsum and random stock photo fallbacks across destination detail pages, home page, AI finder, and JSON data layers (`scripts/enforce-real-photos-only.js`). Enforced 100% genuine Wikimedia Commons landmark photography with automated filtering of non-photo media.
- **28 Hand-Added & Enriched Offbeat Destinations** — Added and enriched 28 high-demand offbeat gems (Bangaram Island, Dawki, Gurudongmar Lake, Hanle, Chopta, Gandikota, Dhanushkodi, Mawlynnong, Lonar Crater, Chembra Peak, Gurez Valley, Unakoti, Sandakphu, Chitrakote Falls, Shekhawati, Dholavira, Zanskar Valley, Polo Forest, Tranquebar, Jibhi, Bhedaghat, Valparai, Tamhini Ghat, Loktak Lake, Dhanaulti, Mandu, Daringbadi, etc.) with custom rich itineraries, real verified photos, place categories, and transport routes.
- **36 States & UTs Matrix & Ladakh Normalization** — Normalized `d.state` strings for Ladakh, updated `meta.states` in `data/destinations/index.json`, synchronized `STATE_ZONE` and `STATE_ALIASES` in `js/data/taxonomy.js`, and validated filter coverage across all 36 States & UTs (`node scripts/validate-filters.js`).
- **UI/UX Pro Max System & High Contrast Overhaul (2026-07-31)** — Comprehensive dark glassmorphism redesign across `ai-finder.html`, `contact.html`, `about.html`, `privacy.html`, and `terms.html`. Upgraded headers, forms, result cards (`cardHTML`), understanding panel (`understandingHTML`), custom itinerary timeline renderer (`generateItineraryHTML`), and site-info cards (`infoCardHTML`) to dark glass containers (`bg-slate-900/80 border-white/15 backdrop-blur-xl shadow-2xl`) with high-contrast text (`text-white` titles, `text-slate-300` body text) and vector SVG icons (`Heroicons/Lucide`) with explicit width/height safeguards.
- **Glowing Mint Pill Buttons ("View All")** — Styled `.section-link` ("View all →") and `.btn-outline` as dark glass pills with glowing mint borders (`#34d399`) and crisp white text.
- **2-Tier Header Stacking & Bounded Sticky Navigation** — Navbar elevated to `z-index: 10000` with dark glass blur background (`rgba(6, 9, 14, 0.92)` + `blur(24px)`), and sticky section tab bar (`#destNavContainer`) bounded inside `.dest-tabs-container` so it sits at `top: 64px` and un-sticks cleanly above *Similar Destinations* and *Footer*.
- **Clean Navbar Header** — Unified navigation links across all pages (`Home`, `Destinations`, `AI Trip Finder`, `About`, `Contact`) and removed right-side "Plan Trip" button.
- **Vanilla JS** throughout (Alpine.js fully removed). Runs over **http(s)**, not `file://`
  (ES6 modules + `fetch()`ed JSON require it) — `node scripts/serve.js` → http://localhost:8080.
- **Live weather** (Open-Meteo) on every destination, auto-refreshing.
- **Pre-stored real photos** — every destination has real Wikimedia photos baked into JSON data files, so hero carousels are **instant & accurate with no live API call**.
- **Hero photo carousel** + **place-detail modal** carousel — both real images only.
- **Filters** — type / budget / state / travel-month + sort, with a scroll-safe sidebar;
  the Hills/Beaches/Heritage nav links highlight correctly on the Explore page.
- **Travel-month coverage normalised** — every month returns an accurate, multi-category set
  (summer hills, monsoon Ghats/Himalaya, year-round pilgrimage). Min any month: 47 destinations.
- **Interactive Monthly Highlights & 5-Image Showcase Carousel** (`index.html`) — Auto-detects current month (July with `NOW` badge), 12-month tab selector pills (`Jan`–`Dec`), dynamic title/subtitle/button, and an interactive photo showcase carousel.
- **Auto-Selected Month Filter & Active Filter Chips** (`destinations.html`) — `destinations.html?month=7` auto-selects Travel Month filter in dropdown and renders an `Active Filters` bar (`📅 Travel Month: July (✕)`) with single-click clear control.
- **Destination Detail 5-Real-Image Overview Carousel** (`destination.html`) — Every destination page renders a 5-real-image carousel at the top of the Overview panel right above *About [Destination]* (hero landscape photo + top 4 attraction photos, slide counter, dots, arrows, 4s auto-play with pause-on-hover).
- **Clean Root Workspace & `stubs/` Folder Architecture** — All 2,383 redirect HTML files organized neatly inside `stubs/` directory (`stubs/<slug>.html`), leaving the project root clean; `scripts/serve.js` updated with Windows case-insensitive path resolution.
- **Company pages** — About / Privacy / Terms / Contact, with shared nav/footer + mobile nav.
- **Contact email automation** — the Contact form delivers real email via **Web3Forms**
  (no backend; set `WEB3FORMS_ACCESS_KEY` in `contact.html`). Honeypot blocks bots.
- **Sign-in removed** everywhere (was a non-functional waitlist stub).
- **Reference doc** — `docs/DESTINATIONS.md` lists all 2,383 by state with months + price/night.
- **Price filter fixed** — the "Price / Night" filter now matches destinations that actually
  *offer a stay in the selected band* (stay price-range overlap) instead of a ceiling on the
  cheapest price.
- **QA pass (all pages)** — consolidated non-filterable types into canonical `DESTINATION_TYPES`; `esc()` HTML-escaping; verified place modal locks background scroll; cleaned redirect stubs.
- **Static Tailwind CSS** — `css/tailwind.css` generated by `scripts/build-css.js`.
- **Bulk-ingest pipeline** (`scripts/bulk/`) — merged over legacy sources → **2,383 total across 36 states/UTs**.
- **Real reach data (nearest airport/railway + city routes)** — offline `scripts/geo-reference.js` dataset (~80 airports, ~80 railheads, 40 cities; Haversine + road-factor). Detail page **"Distance from major cities" filterable dropdown** (`#reachCity`).
- **Broken-coordinate fixes** — 14 destinations corrected via `data/coord-overrides.json`, places re-fetched via `scripts/bulk/refetch-places-overrides.js`.
- **Clickable review counts** — links out to Google reviews search.
- **Mobile filter drawer** (2026-07-15) — Explore sidebar doubles as slide-in drawer below `lg` (1024px). Both mobile nav and desktop nav breakpoints aligned at 768px.
- **Explore filter arrangement** (2026-07-17) — Region → State → Price/Night → Season → Travel Month.
- **Weather auto-refresh 60s → 10 min** (2026-07-17).
- **AI Finder vibe synonyms** (2026-07-17) — `VIBE_SYNONYMS` expands sparse user-language vibes.
- **Home page redesign** (2026-07-19) — interactive **"Explore India" SVG map** (`js/components/indiaMap.js`), **"Best This Month"** rail, **8-chip category strip**, expanded footer.
- **Explore category filters updated (2026-07-20)** — redesigned category buttons (`text-sm`) with custom options (**Road Trips**, **Camping**, **Forts**, and **Ecotourism**).

---

## 🎯 Next up (prioritised)

### P0 — Required before a public launch
1. **Swap the map tile provider.** OpenStreetMap's tile policy forbids heavy/commercial use;
   it will be the first thing blocked at scale. Move to MapTiler / Mapbox / Carto (keyed).
2. **Cache live weather.** ~~Auto-refresh every 60s~~ → **done 2026-07-17: now 10 min**
   (`js/pages/destination.js`). Remaining half: front Open-Meteo with a small cache proxy
   (e.g. Cloudflare Worker) so all viewers of one destination share one cached call.
3. **Deploy on HTTPS and confirm contact-email delivery.** The `WEB3FORMS_ACCESS_KEY` is already
   set in `contact.html`, but Web3Forms only sends from a **browser over http(s)** (not `file://`),
   so email delivery is unverified until deployed — after going live, submit a test message and
   confirm it lands in the key owner's inbox (see [README](../README.md) → Deploy).

### P0.5 — Fix before the next `build-json-data.js` run
0. ~~**`build-json-data.js` silently drops hand-added destinations.**~~ ✅ Fixed 2026-08-01:
   rebuilds preserve manifest entries outside the legacy/bulk source set and derive their Finder
   entries from canonical detail JSON. `--check` verifies the merge without writes.
0.1. **Fix or delete `data/destinations/agra.json`.** Untracked stray file (not in any commit) on a
   broken ad-hoc schema (string `heroImage`/`topPlaces[].image`, `coordinates`/`reachability`
   instead of `overview`/`weather`/`howToReach`, `hotels[].pricePerNight` instead of
   `priceMin`/`priceMax`) — the same shape the 6 Delhi-NCR pages had before
   `scripts/fix-delhi-ncr-final.js` normalized them. Not in `index.json` (invisible to
   Explore/Finder/sitemap) but still reachable and broken via `destination.html?slug=agra` directly.
   The underlying content (11 real top places, 22 real hotels, real Wikimedia photos) is good —
   needs the same schema-conversion `fix-delhi-ncr-final.js` gave the Delhi-NCR pages, then
   re-adding to `index.json`. Full diagnosis in AUDIT.md → 2026-08-01 (later) addendum.

### P1 — Quality & UX
4. **Self-host the photos** — `js/data-photos.js` hotlinks `upload.wikimedia.org`. Optionally
   download the ~641 images into `images/` and rewrite the URLs so the site is self-contained.
5. ~~**Mobile filters**~~ — ✅ done 2026-07-15 (filter drawer below `lg`; see Done section).
6. **Modal accessibility** — add `role="dialog"`/`aria-modal`, focus trap, focus restore
   (applies to the place-detail modal on `destination.html`).
7. **Autocomplete keyboard nav** — the home search dropdown has no Arrow-Up/Down selection or
   debounce (Enter goes to the first match only).
8. **Fix Apr–Sep seasonality data** — 120 of 127 Himalayan-state bulk destinations are wrongly
   winter-tagged because `deriveClimate()` (`scripts/bulk/synth.js`) keys off altitude, which
   Wikidata rarely supplies (e.g. Valley of Flowers tagged Oct–Mar). Add a Himalayan-state
   fallback window `[3,4,5,6,9,10,11]` when altitude is unknown, re-derive those states, then
   `build-json-data.js` + `build-stubs.js` + `build-destinations-doc.js`. Full diagnosis in
   [AUDIT.md](AUDIT.md) → 2026-07-16 addendum.

### P2 — Content & polish
9. **Deepen the 90 generated destinations** — most have 3–4 places; bring them to ≥5 each.
10. **Retry the remaining template hotel names.** The first full OSM pass is complete; 2,085 exact
    generated-template names remain, including zero-result/partial-result locations. Retry only the
    60 destinations marked `hotelSourceError: true` unless a broader refresh is explicitly wanted.
11. **Per-destination SEO/social meta** — `destination.html` now applies meta/OG/Twitter/JSON-LD
    at runtime via `js/components/seo.js` (`applySEO()`); audit coverage across pages.

---

## 📈 Scaling notes (capacity)

The static files scale to **thousands of concurrent viewers** on any CDN (Cloudflare Pages,
Netlify, GitHub Pages, Vercel) — that layer is *not* the bottleneck. The **free third-party
APIs** are:

| Service | Free ceiling (approx) | Fails as |
|---------|----------------------|----------|
| Open-Meteo | ~10k calls/day, ~600/min | Weather stops loading |
| OpenStreetMap tiles | bulk use prohibited | Map blocked first |
| Wikimedia image hotlinks | image serving, no API search | Photo falls back to picsum |

*(Photos no longer hit the Commons **search API** at page load — the URLs are pre-stored in
`js/data-photos.js`; the browser just loads the images from `upload.wikimedia.org`.)*

**As-is estimate:** comfortable to ~**50–150 concurrent active viewers** / a few thousand
views/day before live features degrade (the site stays up — `onerror` fallbacks prevent
crashes). The main remaining live calls are weather + map tiles; completing **P0 #1–#2**
removes nearly all rate-limited calls and lifts the ceiling to tens of thousands of
concurrent viewers on a free CDN.

---

## 🧪 Definition of done (per change)

- Inline scripts parse via the Node `vm` check (see [README](../README.md)).
- Data changes pass the integrity sweep (dup ids, required fields, tiers, coords, stubs).
- After destination content changes: re-run `node scripts/build-destinations-doc.js`
  (regenerates [DESTINATIONS.md](DESTINATIONS.md)) and re-run `build-css.js` if new utility classes were used.
- Verified in-browser with a hard refresh (Ctrl+Shift+R).
- [CLAUDE.md](../CLAUDE.md) updated if architecture/conventions changed.



### Phase 7: Repository-Wide Image Enrichment & Deduplication (ACTIVE: 2026-08-20)
- [x] Multi-Provider Fallback Cascade (Pexels + Unsplash + Wikimedia Commons)
- [x] Zero-Duplicate Image Enforcement across Hero, Gallery (5 items), and Places (3 items each)
- [x] Over 2,240 destinations enriched with 55,681 verified photos
- [x] 30 Indian States and UTs 100% completed
- [ ] Final 100% national sweep completion
Zero-Duplicate Image Enforcement across Hero, Gallery (5 items), and Places (3 items each)
- [x] Over 2,239 destinations enriched with 55,670 verified photos
- [x] 30 Indian States and UTs 100% completed
- [ ] Final 100% national sweep completion
Zero-Duplicate Image Enforcement across Hero, Gallery (5 items), and Places (3 items each)
- [x] Over 1,651 destinations enriched with 37,469 verified photos
- [x] 19 Indian States and UTs 100% completed
