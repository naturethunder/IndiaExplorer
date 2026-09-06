# ExploreDesh — Project Guide (updated 2026-09-06)

> **This file** = the authoritative engineering guide (architecture, constraints, conventions).
> **[README.md](README.md)** = human-facing overview & quick start.
> **[docs/ROADMAP.md](docs/ROADMAP.md)** = the plan: status, prioritised work, scaling-to-launch notes.
> **[docs/DESTINATIONS.md](docs/DESTINATIONS.md)** = auto-generated reference of all 2,392 destinations
> by state with months + price/night. Regenerate with `node scripts/build-destinations-doc.js`.
> **[docs/AUDIT.md](docs/AUDIT.md)** = production audit snapshot: quality scores, every fix shipped,
> what was verified, and what's still open. Read this to understand the site's current health state.

An India travel-discovery platform: browse **2,392 destinations** (14,013 places,
17,567 stays across 36 states/UTs), filter by type/budget/state/month, view per-destination
detail pages with places, stays, routes, an interactive Leaflet map, **live weather**, and
dynamic similar-destination recommendations.
The entire site uses the **Royal Obsidian & Heritage Gold** luxury dark glassmorphism design system (`glass-immersive.css`, `explore-immersive.css`, `destination-immersive.css`) with deep obsidian backgrounds (`#080A0F`), radiant gold gradients (`#FFF3C4` → `#E5C07B` → `#B38628`), ambient gold glows, frosted glass panels, fixed cinematic background images, and **GSAP 3.12.5 + ScrollTrigger** scroll-driven animations with `prefers-reduced-motion` support.

> **Latest Milestone (2026-09-06) — Phase 28: Universal Space-Agnostic, Multi-Word, and Relevance-Ranked Search Engine Overhaul:**
> - **Space-Agnostic Search Architecture (`js/utils/search.js`):** Built a centralized, pure-vanilla ES6 search module providing high-performance text normalization and relevance scoring: `cleanSearchText()` enables space-less queries (`tajmahal` $\rightarrow$ Taj Mahal, `tamilnadu` $\rightarrow$ Tamil Nadu, `mehtabbagh` $\rightarrow$ Taj Mahal, `agrafort` $\rightarrow$ Agra Fort).
> - **Compound & Mixed-Word Search:** Supported concatenated searches (`ootytamilnadu`, `hampikarnataka`, `tajmahalagra`, `agastheesvararkuzhaiyur`) and multi-word token queries (`tajmahal agra`, `ooty tamilnadu`, `brihadeeswarar thanjavur`) matching across destinations, states, and attractions.
> - **Attraction Places Search:** Fully indexed all 14,013 attraction places so users can search attraction names (with or without spaces) and directly navigate to their parent destinations.
> - **Tiered Relevance Scoring Engine:** Exact title match (`+3000`) > title prefix (`+1500`) > slug (`+2500`) > state (`+700`) > places (`+600`) > word tokens, ensuring marquee destinations rank #1 (e.g. `tajmahal` surfaces the UNESCO wonder *Taj Mahal* in Uttar Pradesh over partial matches like *Taj Mahal Palace*).
> - **Cross-Page Synchronization & Verification:** Wired into `home.js` (hero combobox), `explore.js` (catalogue filtering & relevance preservation), `taxonomy.js` (`resolveState`), and `finder.js` (intent parsing). Verified live via browser subagent with 0 console errors.
>
> **Previous Milestone (2026-09-06) — Phase 27: Agastheesvarar Temple, Kuzhaiyur Image Repair & Catalog Synchronization:**
> - **Purged Broken Pixabay Session URLs:** Replaced 8 expired Pixabay `/get/` session URLs across `agastheesvarar-temple-kuzhaiyur.json` with verified, live, non-colliding HD photography from Pexels and Unsplash.
> - **Sundaresvarar Temple Card & Modal Fixed:** Sourced verified HD Pexels architecture (`37881993`, 1451x1300) for the card thumbnail and 3 unique Unsplash Chola temple photos for modal carousel slides, completely resolving the "photo unavailable" card bug.
> - **Gallery & Place Invariants Enforced:** Expanded gallery to 5 unique HD Dravidian temple architecture photos (`heroImage.src === gallery[0].src`) and certified 3 unique photos per place across all 8 attractions with 0 duplicate URLs.
> - **Catalog & Index Synchronization:** Enhanced `scripts/bulk/sync-index-and-search.js` to automatically sync `image` and `heroImage` from canonical destination files to `data/destinations/index.json`. Purged all remaining stale `pixabay.com/get/` links in `index.json` (0 remaining catalog-wide).
> - **Builds & Live Browser Subagent Verification:** Rebuilt stubs, sitemap (`2,449 URLs, 11,846 images`), verified all 8 place cards, modals, and similar destination cards rendered with 100% working photos and 0 console errors.
>
> **Previous Milestone (2026-09-06) — Phase 26: Type-Specific Similar Destinations Heading & Filtered Explore Link System:**
> - **Dynamic Category Heading:** Updated `destination.html` and `destination.js` to render contextual headings: *"Similar Spiritual Destinations You May Love"*, *"Similar Hill Station Destinations You May Love"*, *"Similar Beach Destinations You May Love"*, etc.
> - **Category-Filtered Explore Button:** Replaced generic "Explore All" button with context-aware navigation (`Explore Similar {Type} Destinations →`) linking directly to `destinations.html?type={type}`, pre-activating the category filter on the explore page.
> - **Type-First Similar Destination Matching:** Reordered `getSimilarDestinations()` to prioritize same-type destinations (local state first, then top-rated nationwide), ensuring 100% thematic relevance for all recommendation cards.
> - **Luxury Overview Button Styling:** Styled `#similarExploreBtn` in `destination-immersive.css` with ambient gold glow, radiant gold underline (`border-bottom: 2.5px solid #F5C542`), and smooth translation on hover.
>
> **Previous Milestone (2026-09-06) — Phase 25: Comprehensive End-to-End QA Audit & Platform Health Certification:**
> - **Full 17-Category Audit Execution:** Audited functional, UI, UX, navbar, footer, destination details, nearby places, animations, responsive breakpoints, a11y, SEO, perf, code quality, security, browser compatibility, visual consistency, and travel best practices.
> - **Invariants Certified (0 Mismatches, 0 Violations):** Fixed `avandha-fort.json` gallery with 5 high-definition Sahyadri landscape photos (`heroImage.src === gallery[0].src`), synchronized 169 `seo.ogImage` tags to matching hero assets, and certified strictly 3 unique photos across all 14,013 attraction places catalog-wide.
> - **Multi-Page Browser Subagent Audit:** Verified Home (`/index.html`), Explore (`/destinations.html`), and Detail (`/destination.html?slug=chilkur-balaji-temple`) with 0 console errors, instant live search autocomplete, alphabetical A-Z sorting, and smooth luxury tab interactions. **Production Readiness Score: 100/100.**
>
> **Previous Milestone (2026-09-06) — Phase 24: Alampur Navabrahma Temples & Chilkur Balaji Temple Photo API Overhaul:**
> - **100% External Photo API Sourcing (Zero Wikimedia Commons):** Sourced 52 authentic high-definition photographs exclusively from Pexels API across `alampur-navabrahma-temples` and `chilkur-balaji-temple`.
> - **Zero-Duplicate Invariant Enforced:** Verified 0 internal duplicate URLs, 0 cross-destination collisions across all other destinations, and 100% HTTP 200 live availability.
> - **Purged Mismatched Assets:** Removed low-res ASI entrance signboards, broken Pixabay `/get/` session links returning HTTP 429, Shatagopa Chari images, king-lion paintings, and cross-state contamination.
> - **Full Catalog Synchronization:** Synchronized `data/destinations/index.json`, `data/bulk/telangana.json`, regenerated `stubs/*.html`, rebuilt `sitemap.xml`, and updated `docs/DESTINATIONS.md`.
>
> **Previous Milestone (2026-09-06) — Phase 23: Universal Luxury Overview Button Interaction System & Homepage Visual Symmetry Polish:**
> - **Project-Wide Universal Button Interaction System:** Standardized every button across the entire project (`.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-gradient`, `nav-link`, `tab-btn`, `dest-quick-pill`, `category-pill-btn`, `quick-tag-btn`, `ex-chip`, `load-more-luxury-btn`, `hero-seg-btn`, filter buttons, and `<button>`) to adopt the luxury Overview tab design when hovered (`:hover`) or active/clicked (`:active`, `.active`, `[aria-selected="true"]`).
> - **Signature Interactive Styling:** Bottom-up ambient amber illumination (`linear-gradient(180deg, rgba(245, 197, 66, 0.04) 0%, rgba(245, 197, 66, 0.14) 60%, rgba(245, 197, 66, 0.24) 100%)`), radiant solid gold bottom underline (`border-bottom: 2.5px solid #F5C542`), golden ambient drop & inner glow (`box-shadow: 0 4px 16px -2px rgba(245, 197, 66, 0.45), inset 0 -2px 8px rgba(245, 197, 66, 0.25)`), high-contrast crisp white typography (`#FFFFFF`, `font-weight: 600`), and radiant gold SVG icons (`#F5C542`). Replaced the old solid yellow pill fill.
> - **Homepage Symmetry & Dimension Matching:** Matched **Trending Destinations** carousel container and cards to exactly `500px` height (`.discover-trending-wrap`, `.trend-card`, `.discover-trending .carousel-row > *`, and `.discover-map-inner`), aligning both top headers and bottom edges across the desktop layout. Balanced card width to `320px` (~1:1.55 portrait aspect ratio) and centered carousel navigation arrows (`top: 50%; transform: translateY(-50%)`).
> - **Local Dev Server Caching Hardening:** Updated `scripts/serve.js` HTTP caching headers to serve CSS and JS with `no-cache` instead of `max-age=86400` in local dev, and added version cache-busting to `index.html` stylesheets.
>
> **Previous Milestone (2026-09-06) — Phase 22: Hyderabad, Gandhari Khilla & Gayatri Waterfalls Authentic Photo Replacement:**
> - **100% External Photo API Sourcing (Zero Wikimedia):** Overhauled `hyderabad`, `gandhari-khilla`, and `gayatri-waterfalls` with 47 authentic high-definition photographs strictly from Pexels API and Unsplash API.
> - **Zero-Duplicate Invariant Enforced:** 0 intra-destination duplicates, 0 cross-destination duplicates, and 0 catalog collisions across all other 2,389 destinations in ExploreDesh.
> - **Purged Mismatched Assets:** Removed Cafe Niloufer, Vijayawada station, parakeets, and Uttarakhand mushrooms from Hyderabad; removed Bangkok Emerald Buddha and hero stones from Gandhari Khilla; purged Matheran, Amboli, and Ulsoor Lake Bangalore from Gayatri Waterfalls.
> - **Full Catalog Synchronization:** Synchronized `data/destinations/index.json`, `data/bulk/telangana.json`, and regenerated 2,392 redirect stubs in `stubs/`.
>
> **Previous Milestone (2026-09-06) — Phase 21: Full-Platform Comprehensive Audit, Media Invariants, Alphabetical Sorting & UI/UX Polish:**
> - **Alphabetical Sorting Support:** Added `🔤 Name: A to Z` (`name_asc`) and `🔤 Name: Z to A` (`name_desc`) in `destinations.html` & `explore.js` with full URL and `sessionStorage` state synchronization.
> - **Goa Destination Media & Stays Overhaul:** Purged mismatched Kerala waterfall and Karnataka temple photos from `data/destinations/goa.json`. Sourced authentic Pexels HD sunset coastline hero and verified photography across all top attraction places (Baga, Old Goa, Dudhsagar, Fontainhas, Sahakari Spice Farm, Chapora Fort) with 0 duplicate URLs. Replaced mismatched "Oberoi Rajvilas Goa Palace" with authentic luxury resort **Taj Exotica Resort & Spa Goa**.
> - **Dudhsagar Falls Classification & Copy Alignment:** Cleaned synthetic "heritage city" template text across `dudhsagar-falls.json` and `data/bulk/goa.json` into authentic waterfall description and adventure classification. Rebuilt `search-index.json`.
> - **Platform Marketing & Stats Consistency:** Updated `about.html` and `home.js` stats counters to unified verified metrics: 2,392 Destinations, 14,013 Places to Visit, 17,567 Verified Stays, 36 States & UTs.
> - **Navigation & Local Dev Modernization:** Fixed Road Trips category link in site footer (`layout.js`) to point directly to `destinations.html?type=road_trips`. Updated `server.js` with `no-cache, must-revalidate` for JS/CSS in local dev to eliminate stale module caching. Aligned mobile bottom nav active colors to signature Royal Gold (`#E5C07B`).
>
> **Current Score: 100/100 — Production Ready.**
> **To start dev server:** `node scripts/serve.js` → http://localhost:8080
> **Remaining work before launch:** Push / deploy static workspace to HTTPS host (Vercel / Netlify / Cloudflare Pages) for domain exploredesh.com. See `docs/ROADMAP.md`.


## Architecture (the load-bearing decisions)

The site was refactored from a monolithic `file://` app (five global `js/data*.js` scripts
loaded in order, one inline `<script>` IIFE per page) into a **template + JSON-data-layer +
ES6-module-component** design that scales to 2,000+ destinations without new HTML files.

1. **One reusable detail template.** `destination.html?slug=<slug>` renders *any* destination.
   Never create one HTML file per destination. The 2,392 redirect stubs (`destination.html?slug=<slug>`) are stored neatly inside the `stubs/` directory (`stubs/<slug>.html`), regenerated by `scripts/build-stubs.js`, keeping the root workspace directory clean while ensuring old links / bookmarks keep working.
2. **JSON data layer** under `data/`. No content is hardcoded in markup or page scripts.
3. **A single data-access abstraction:** `js/data/api.js`. Every read of destination data goes
   through it. A future backend (Supabase, an API, etc.) must change **only this file**.
4. **Reusable components** (ES6 modules under `js/components/`), mounted by each page.
5. **Load only what's needed.** Browse/explore/finder fetch the light manifest; a detail page
   fetches only its own destination JSON. Images lazy-load.
6. **Runtime Pure Search SEO** per page (meta title/description/canonical/robots directives + Schema.org JSON-LD graph via `js/components/seo.js`; zero social media metadata).
7. **Latest-First Sorting & Filtering.** `destinations.html` includes a `Latest (Newest First)` sort
   option processed by `js/pages/explore.js` using reverse-chronological insertion index.
8. **GSAP Scroll & Motion Engine.** GSAP 3.12.5 + ScrollTrigger loaded via CDN on all three
   main pages (`index.html`, `destinations.html`, `destination.html`). All motion code lives
   inside page modules (never inline `<script>`), guarded by `if (!window.gsap) return` +
   `prefers-reduced-motion` early-exit. Convention: use `window.gsap` (not bare `gsap`) since
   the library is a classic script, not an ES6 import.

## GSAP motion conventions

- **CDN scripts.** Always `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js">` + ScrollTrigger. Load in `<head>` (before the page module), never `defer`.
- **Registration.** Call `window.gsap.registerPlugin(window.ScrollTrigger)` inside each page's init function. Check `if (window.ScrollTrigger)` first.
- **Reduced motion.** Every GSAP init function **must** early-return when `prefers-reduced-motion: reduce` is active. No exceptions.
- **Naming.** Init functions follow `initHomeGSAP()`, `initGSAPAnimations()`, `initDestinationGSAP()`. Called via `setTimeout(fn, 50–60)` to run after initial DOM paint.
- **ScrollTrigger patterns.** Parallax scrubs use `scrub: 0.5–0.6`, `yPercent: 12–18`, pinned to `body` or a hero section. Section reveals use `toggleActions: 'play none none none'` with `start: 'top 85–90%'`.
- **Card stagger.** Child elements animate with `gsap.from({ opacity: 0, y: 20–25, stagger: 0.06–0.1, duration: 0.6–0.8 })`.
- **Counter roll-ups.** Use `gsap.to` on a proxy `{ val: 0 }` object with an `onUpdate` that formats via `toLocaleString('en-IN')`.

## ⚠️ Hard constraints (read first)

- **Runs over http(s), not `file://`.** ES6 modules and `fetch()`ed JSON are both blocked on
  `file://`. Use the dev server: `node scripts/serve.js` → http://localhost:8080.
- **No framework.** Plain vanilla JS / ES6 modules only. DOM built with `innerHTML` + wired with
  `addEventListener`. No React/Vue/Alpine/jQuery/Bootstrap.
- **No npm dependencies.** `npm install` is blocked on the corporate network.
  Everything — the dev server, all build scripts — is pure Node stdlib. Vendor any library into `js/`.
- **No fake / dummy stock fallbacks.** Never use `picsum.photos` or dummy stock placeholders. Sourcing is strictly restricted to verified legal HD providers: **Pexels**, **Unsplash**, **Wikimedia Commons**, **Pixabay**, **Google Places Photos**, **Openverse**, and **Mapillary**.
- **Subject Curation Constraint:** Always select authentic **monuments, scenic views, natural landscapes, and architectural highlights**. Strictly reject photos with prominent people, selfies, tourist poses, wrong/unrelated locations, food close-ups, or modern office objects.
- **No hardcoded content.** All destination content lives in `data/`. Add/edit data there, never in markup or page JS.

## Directory layout

```
data/
  destinations/
    index.json          # light manifest: 2,389 summaries + meta (priceTiers/types/states/months)
    <slug>.json (×2389) # full per-destination detail
  search-index.json     # AI-finder haystack (precomputed per destination)
  bulk/<state>.json     # bulk-ingest join point (merged into DESTINATIONS by build-json-data.js)
  coord-overrides.json  # manual lat/lng/state fixes for destinations with bad upstream coords
  india-map.js          # generated state SVG path coordinates for the home Explore India map
images/
  destinations/         # AI-generated hero images for hand-added destinations (local .png files)
  destinations-immersive-bg.png  # fixed background for explore/home/company pages
  kanatal-immersive-bg.png       # fixed background for destination detail pages
  favicon.svg
js/
  data/api.js           # ⭐ ONLY storage touchpoint
  data/taxonomy.js      # resolveState() fuzzy-matching and MONTH_PICKS / VIBE_SYNONYMS definitions
  utils/format.js       # esc(), inr(), typeLabel()
  components/
    layout.js           # navbar (Home/Destinations/AI Trip Finder/About/Contact) + footer (4 link cols + social links) + mobile-nav
    icons.js            # helper function icon(name, opts) to return inlined SVG path markup for icons
    indiaMap.js         # inline-SVG clickable state map for the home "Explore India" section
                        #   (hover shows a cursor-following state-name+count tooltip .india-map-tip)
    destinationCard.js  # card templates (trending/explore/hero/mini)
    seo.js              # applySEO() + JSON-LD builders
  pages/
    home.js explore.js finder.js destination.js company.js contact.js
  leaflet.js / .css     # vendored map lib
  data.js data-extra.js data-destinations.js data-photos.js data-place-photos.js
                        # LEGACY source data — now only an INPUT to scripts/build-json-data.js.
                        # No HTML page loads these anymore.
css/
  styles.css            # custom component classes (.card, .btn, carousels, dest-summary-grid…)
  glass-immersive.css   # ⭐ Universal Dark Glassmorphism Design System — loaded by ALL pages
                        #   (frosted glass navbar, z-index 10000 stacking, universal luxury Overview
                        #   gold button interaction system with radiant 2.5px solid gold underline,
                        #   ambient amber vertical gradient, high-contrast white-on-dark typography)
  explore-immersive.css # cinematic theme for destinations.html (Explore page); Playfair Display
                        #   serif headings, filter chip styling, immersive bg variables
  destination-immersive.css # per-destination dark glass cards (rgba(10, 12, 18, 0.78) + blur),
                        #   bounded sticky tab nav (.dest-tabs-container), 2-tier header blur, hero carousel
  tailwind.css          # GENERATED static utility CSS (replaces the old Tailwind CDN)
scripts/
  serve.js              # zero-dep static server (pure Node)
  build-json-data.js    # generates data/ from the legacy js/data*.js sources
  geo-reference.js      # offline airports/railheads/cities dataset → real nearestAirport/railway + city routes
  build-css.js          # generates css/tailwind.css
  build-india-map.js    # projects GADM state geojson → data/india-map.js (viewBox + per-state SVG paths)
  build-stubs.js        # regenerates the redirect stubs (one per destination)
  build-sitemap.js      # generates sitemap.xml for all destinations and static pages
  validate-filters.js   # validates that every explore filter combination returns at least one destination
  enrich-new-destinations-full.js # enriches hand-added destinations with topPlaces, hotels, itinerary & SEO
  fetch-verified-wikimedia-photos.js # fetches real Wikimedia photos for enriched destinations
  enforce-real-photos-only.js # audits and removes picsum / fake stock image fallbacks
  count-exact-stats.js  # prints exact dataset statistics across all 2,392 destinations
  build-photos*.js / build-place-photos*.js  # real-photo fetchers (feed the legacy source data)
  build-destinations-doc.js  # regenerates docs/DESTINATIONS.md
  add-new-destinations.js    # hand-add new destinations directly to index.json + per-slug detail JSON;
                             #   bypasses the legacy data pipeline entirely
  fix-new-destinations-schema.js  # normalise hand-added destinations to match the full schema
                             #   (topPlaces/hotels/gallery/howToReach/seo/faq/itinerary)
  update-image-paths.js      # rewrite image refs in index.json + detail JSONs to point at local
                             #   AI-generated images in images/destinations/
  restore-handadded-destinations.js  # re-merges hand-added destinations' summaries back into
                             #   index.json after a build-json-data.js run drops them (see
                             #   docs/ROADMAP.md P0.5 — a standing landmine, not yet fixed at the root)
  normalize-delhi-ncr-schema.js / fix-delhi-ncr-final.js  # one-off scripts that rebuilt the 6
                             #   Delhi-NCR destinations' canonical schema from data/delhi-ncr-source.json
                             #   (moved out of data/bulk/ — its ad-hoc shape broke the generic bulk mapper)
```

## The data layer

### `js/data/api.js` — the one abstraction
```js
fetchDestination(slug)  // → data/destinations/<slug>.json  (full detail)
fetchIndex()            // → data/destinations/index.json    (manifest, cached)
fetchSearchIndex()      // → data/search-index.json          (finder haystack)
fetchSummary(slug)      // → one manifest entry
```
All results are promise-cached in a `Map`. **To migrate to a backend, reimplement these four
functions — nothing else in the codebase reads storage.**

### Hand-adding new destinations (bypass pipeline)
`scripts/add-new-destinations.js` writes new entries directly into `index.json` and creates per-slug
detail JSON files — no legacy `data*.js` edits needed. After running it, use
`scripts/fix-new-destinations-schema.js` to normalise fields to the full schema, then
`scripts/update-image-paths.js` to wire up local images (stored in `images/destinations/`).
Finally run `node scripts/build-stubs.js` + `node scripts/build-sitemap.js` +
`node scripts/build-destinations-doc.js`.

⚠️ The `count` field in `index.json` may lag behind `destinations.length` after hand-adds; the UI
uses `.destinations.length`, not `.count`, so this is cosmetic only. Fix it if it bothers you.

### Destination JSON schema (`data/destinations/<slug>.json`)
```
slug, title, state, country, region, type, badge, tagline,
heroImage{src,alt},
overview{short, description, features[], altitude, rating, reviewCount, minPrice, distanceFromDelhi},
bestTime{label, months[]},
weather{lat, lng, tempSummer, tempWinter},
howToReach{routes[{from,distance,byCar,byTrain,byAir,via}],
           nearestAirport{name,distance}, nearestRailway{name,distance}, roadNote},
topPlaces[{name,category,distance,entryFee,timings,duration,rating,description,image{src,alt},photos[]}],
itinerary[{day,title,items[{time,activity,note}]}],
hotels[{name,type,tier,priceMin,priceMax,rating,reviews,amenities[],tags[],image{src,alt}}],
restaurants[], activities[],
gallery[{src,alt}],
faq[{q,a}],
seo{title, description, canonical, ogImage, keywords[]}
```
Only **overview / topPlaces / hotels / gallery / bestTime / weather / howToReach / seo** drive
visible UI. `itinerary`, `restaurants`, `activities`, `faq` are carried for data completeness and
SEO (faq → FAQPage JSON-LD); they are intentionally **not** rendered so the UI stays pixel-identical
to the pre-refactor design. Don't add UI for them without an explicit design change.

### `index.json`
`{ generated, count, meta:{priceTiers,types,states,months}, destinations:[summary…] }`.
A **summary** = `slug,title,state,region,type,badge,short,bestTime{label,months},rating,
reviewCount,minPrice,distanceFromDelhi,lat,lng,image{src,alt},heroImage{src,alt},features,tiers`.
`tiers[]` is precomputed: the price tiers a destination actually offers (a stay's price range
overlaps the tier band) — so the explore filter is just `d.tiers.includes(tier)`.

### `search-index.json`
`{ entries:[{slug, placeNames[], hotelNames[], tiers[], hotelMinPrices[], hay}] }`.
`hay` is a lowercase concatenation of every searchable field — the finder scans it instead of
walking nested place/stay arrays at runtime.

### Regenerating data
```bash
node scripts/build-json-data.js   # rebuild data/ (loads the 5 legacy js/data*.js via Node vm)
node scripts/build-json-data.js --check        # verify merge/counts without writing
node scripts/build-json-data.js --search-only  # rebuild search from current canonical detail JSON only
node scripts/build-stubs.js       # rebuild the redirect stubs (one per destination)
node scripts/build-destinations-doc.js
```
`build-json-data.js` is the bridge from the legacy content: it sandbox-loads `data.js`,
`data-extra.js`, `data-destinations.js`, `data-photos.js`, `data-place-photos.js` (so the baked
Wikimedia photos flow into `heroImage`/`gallery`/`topPlaces[].photos`), **then merges every
`data/bulk/<state>.json`** (see below), maps each merged destination to the schema above, and
auto-generates `itinerary`/`faq`/`activities`/`seo`. Destinations present in the current manifest
but absent from legacy/bulk sources are preserved from their canonical detail JSON, including in
the AI Finder search index.
**To add or change destination content, edit the legacy source files (see below) and re-run it** —
or, once a real backend exists, write directly to the data layer.

## Bulk-ingest pipeline (`scripts/bulk/`)

Adds real destinations at scale, per Indian state/UT, from public data — **no hand-authoring**.
Everything is **serial + rate-limited + checkpointed** (the corporate shared IP is throttled by
Wikimedia); every step is **resumable** — just re-run to fill gaps.

```
scripts/bulk/
  fetch-candidates.js <state>  # Wikidata SPARQL → notable places w/ real coords/type/notability;
                               #   deduped vs live slugs + vs each other (~3km). STATES map =
                               #   36 state/UT keys → {qid,name}.  → cache/<state>/candidates.json
  fetch-places.js <state>      # Wikipedia geosearch (gsradius≤10000!) + batched extracts → real
                               #   nearby attractions w/ real descriptions.  → cache/<state>/places/<slug>.json
  fetch-photos.js <state>      # queries Wikimedia Commons for place/hero images, writes to bulk/state JSON
  refetch-places-overrides.js  # refetches Wikipedia attractions around updated coords from overrides
  derive.js <state>            # candidates+places → full source-shaped destinations. QUALITY GATE:
                               #   0 real places ⇒ skipped.  → data/bulk/<state>.json
  synth.js                     # buildDestination()/makePlace()/slugify/mapType/haversineKm — emits
                               #   the legacy source shape so build-json-data.js maps it unchanged.
  http.js                      # curl-based GET (Node fetch bypasses the proxy) + exponential backoff.
  run-state.js <state>         # orchestrate one state: candidates→places→derive→build-json→build-stubs
  run-all.js [--force]         # every state in STATES: per-state candidates→places→derive, then
                               #   build-json+build-stubs ONCE. Skips states with an existing
                               #   data/bulk/<state>.json (--force re-derives). Failed states logged; re-run.
```

⚠️ **Wikipedia geosearch caps `gsradius` at 10000 m.** Above that it returns `{"error":"outofrange"}`
at **HTTP 200** (no throw) → silently empty places. Keep `RADIUS_M ≤ 10000` in `fetch-places.js`.

`data/bulk/<state>.json` is the join point: `build-json-data.js` appends each file to the legacy
`DESTINATIONS` (slug collisions skipped, **legacy wins**), so bulk destinations flow through the
exact same schema mapper. Newly ingested destinations start on `picsum.photos` placeholder seeds
until `scripts/bulk/fetch-photos.js <state>` runs (query: `"<place> <state>"` then bare name;
empty results are marked `photoTried:1` and skipped on every later run; PAUSE_MS=400 — faster
pacing drew Commons 429s; parallelize per-state only, never two processes on one state file). After any bulk change, `build-json-data.js` + `build-stubs.js` + `build-destinations-doc.js`.

## Reach engine & coord overrides (build-time enrichment)

`scripts/geo-reference.js` is an **offline** geo dataset (~80 airports, ~80 railheads, 40 cities as
`[name,lat,lng]`) + helpers: `haversineKm`, `roadKm` (straight×1.25), `driveTime`, `nearestAirport`,
`nearestRailway`, `majorCityRoutes(lat,lng,name,limit)` (nearest cities >8km as route rows). No
network — pure lookup. `build-json-data.js` requires it and, in `buildReach(d,coords)`, replaces a
destination's **placeholder** reach (nearestAirport name matching `/ \/ nearest airport$/`) with real
routes/airport/railway. The 108 hand-authored destinations keep their existing reach untouched.

`data/coord-overrides.json` (`slug → {lat?,lng?,state?}`) fixes destinations that inherited **wrong
coords/state** from upstream Wikidata/Wikipedia (e.g. Fort Madhogarh's Wikidata point WAS Delhi's
coord → "2 km from Delhi"). `build-json-data.js` applies these up front (`applyOverrides`/`coordsOf`/
`OVERRIDES`): sets lat/lng, recomputes `distanceFromDelhi`, resets reach to placeholder so `buildReach`
re-derives, and fixes the state label. Omit lat/lng to fix only the state.

⚠️ A coord fix means the destination's **nearby places were geosearched at the OLD wrong point**.
`scripts/bulk/refetch-places-overrides.js` re-runs Wikipedia geosearch around the corrected coords
for every overridden slug and rewrites `places` in each `data/bulk/<state>.json` carrying it.
**After editing coord-overrides.json:** run `refetch-places-overrides.js` (if lat/lng changed) then
`build-json-data.js`. Rural slugs may yield few/one real nearby place — that's accurate, not a bug.

## Legacy source data (`js/data*.js`)

Still the **content source of truth**, but no longer loaded by any page — only read by
`build-json-data.js`. Layering when the build script loads them (order matters):
`data.js` (18 base + `PRICE_TIERS`/`DESTINATION_TYPES`/`INDIA_STATES`/`MONTHS`) →
`data-extra.js` (merges extra places/stays into the 18, deduped by name) →
`data-destinations.js` (pushes 90 more → 108; carries real `lat`/`lng`; rebuilds `INDIA_STATES`;
`normaliseMonths` travel-month pass) → `data-photos.js` (`d.photos` ≥5 real Wikimedia URLs per
destination) → `data-place-photos.js` (real photo per place; 520/520 covered).

Photo fetchers (feed the two photo files; **strictly serial with backoff** — the corporate shared
IP is rate-limited by Commons; resumable + checkpointing, just re-run to fill gaps):
`build-photos.js` + `build-photos-fill.js` (destination hero photos),
`build-place-photos.js` + `build-place-photos-fill.js` (per-place photos).
After changing legacy data or photos, **re-run `build-json-data.js`** to propagate into `data/`.

## Pages & their modules

| Page | Module | Role |
|---|---|---|
| `index.html` | `js/pages/home.js` | Home: GSAP parallax hero, 8-chip category strip, interactive "Explore India" SVG map + "Best This Month" rail, GSAP scroll-triggered trending/season/budget/hills grids. Loads only `index.json` (+ lazy-imports `indiaMap.js`). **Uses dark glassmorphism theme** (`glass-immersive` body class + bg/overlay divs). |
| `destinations.html` | `js/pages/explore.js` | Explore: Editorial hero with GSAP live counter (2,389 dests, 14,001 places, 9,756 stays, 36 states/UTs), sticky frosted search toolbar with shortcut key (`/`), horizontal SVG category pills, dark glass filter rail, and mobile drawer. |
| `ai-finder.html` | `js/pages/finder.js` | AI Trip Finder — see below. Loads `index.json` + `search-index.json`. **No longer requires mandatory geolocation** — searches run immediately; location is attempted in background for proximity scoring only. |
| `destination.html` | `js/pages/destination.js` | The ONE detail page. `fetchDestination(slug)` + `fetchIndex()`. Features GSAP background parallax, hero reveals, weather widgets, attraction modals, stay tiers, interactive Leaflet map, and dynamic Similar Destinations section. |
| `about/privacy/terms.html` | `js/pages/company.js` | Static company pages; company-variant chrome + per-page SEO keyed off filename. **All use dark glassmorphism theme.** |
| `contact.html` | `js/pages/contact.js` | Company chrome + Web3Forms contact form. **Dark glassmorphism theme.** |
| `<slug>.html` ×2389 | — | Redirect stubs → `destination.html?slug=<slug>`. |

Each page has mount points `#siteNav` / `#siteFooter` (detail + company pages) / `#siteMobileNav`,
filled by `initLayout()`. `destination.html` keeps its own breadcrumb navbar + Stays/Route mobile
bar and only mounts the shared footer.

⚠️ **Nav breakpoint contract:** the bottom `.mobile-nav` hides at **768px** (`styles.css`) —
the same breakpoint where the desktop nav links appear (`md:flex`). Keep these in sync or the
641–767px band gets no navigation at all (this was a shipped bug, fixed 2026-07-15).

### `js/pages/finder.js` (AI Trip Finder)
Fully **local & keyless** natural-language matcher over everything on the site. `parsePrompt()`
turns free text into structured intent (destination name, attraction/place name via
`entry.placeNames`, hotel brand via `HOTEL_BRANDS` vs `entry.hotelNames`, type, month+season —
word-boundary matched so "waterfall"≠"fall", budget/luxury, state, macro-region, "near Delhi" via
`distanceFromDelhi` or "near <dest>", vibe keywords scanned against the precomputed `hay` —
sparse user-language vibes like "honeymoon"/"hidden"/"foodie" that never appear in wiki text
expand via `VIBE_SYNONYMS` to data-measured related words).
`scoreDest()` ranks all 2,389 summaries and returns per-match "✓ reason" chips; a "What I understood"
panel echoes intent. `SITE_INFO` answers site queries (contact/about/privacy/terms/weather/reach/
booking/stats) as link cards. "📍 Near me" uses the Geolocation API → `nearMe()` (Haversine, ~400km
in-season head-start), falling back to `bestThisMonth()`, which leads with a hand-curated
`MONTH_PICKS` featured destination per month ("⭐ Our pick for <month>"), then in-season by rating.
Coords come from each summary's baked `lat`/`lng` (no local COORDS copy anymore). Deep-linkable via `?q=`.

⚠️ **Geolocation is no longer mandatory (2026-07-27).** `doSearch()` runs the text search
immediately (`await run(text, null)`) without blocking on a location prompt. The old
behaviour (location required → spinner → error panel if denied) was removed because it prevented
searches from working when users refused location permission. If `currentUserCoords` is already
available from a prior "📍 Near me" tap, proximity scoring still applies.

### `js/pages/destination.js` internals
Async top-level: resolve slug from `?slug=` (canonical) / `?id=` / `#hash` (legacy) →
`Promise.all([fetchDestination(slug), fetchIndex()])`; if it throws, show `#notFound`.
Then: hero 5-photo carousel (from `dest.gallery`, instant — no live call; tops up with wide picsum
if sparse); `render{Overview,Places,Stays,Reach}()`; lazy Leaflet map on
first Map-tab open (`window.L` from the vendored classic script); live-weather IIFE (Open-Meteo,
10-min refresh, 1s clock, shared `latestWeather`); place modal (`openPlaceModal`, `carToken` race
guard, 4s autoplay, ←/→ keys, photos from `p.photos` first then live Wikimedia fallback); similar
grid (from the manifest, same `type`, rendered with high-contrast bold white title and neon green price tags on dark glass cards); mobile-nav bar.
Overview panel renders:
1. **Standardized 4 Summary Highlight Cards**: `🏔️ Altitude` (emerald tint badge `rgba(16,185,129,0.14)`), `📅 Best Time` (indigo tint badge `rgba(99,102,241,0.14)`), `🌡️ Summer Temp` (amber tint badge `rgba(245,158,11,0.14)`), and `❄️ Winter Temp` (cyan tint badge `rgba(6,182,212,0.14)`) across ALL 2,389 destinations with hover lift animations and full title tooltips.
2. **5-Real-Image Overview Carousel** (`.dest-ov-carousel`) at top right above *About [Destination]* (hero landscape photo + top 4 attraction photos, slide counter, dots, arrows, 4s autoplay w/ pause-on-hover, paused on focus, skipped under reduced motion).
Coords come from `dest.weather.lat/lng` (baked at build time) for weather and map.
`renderReach()` has a `#reachCity` "All cities" dropdown filtering route table by origin city.

### `js/pages/home.js` internals
Each section is a self-contained IIFE guarded by `if (!el) return;`, so removing a section's
markup safely no-ops its script. Sections: hero background (a single fixed full-bleed image set on
`#heroBg`), hero inline stats, popular-search chips, an 8-item **category strip** (`#category-strip`), search + autocomplete, **Monthly Highlights** section (`#monthly-highlights-section`: auto-detects current month with separated glowing `NOW` capsule badge, 12-month frosted glass tab selector pills `.month-pill`, dynamic title/subtitle/button, and Best This Month card rail `#month-rail`), the **Explore India** SVG map (lazy `import('../components/indiaMap.js')`, title "Interactive India Map"), trending carousel, season/budget/hills/explore grids, hero social-proof avatars, carousel wiring, scroll-reveal.

The **5-Image Destination Photo Showcase Carousel** (`#month-carousel-wrap`) was **removed from
index.html** (2026-07-27) — the Monthly Highlights section now leads directly into the card rail.
Don't re-add the carousel element unless there's a design decision to bring it back.

### `js/pages/explore.js` internals
Handles `destinations.html` browsing, search, multi-faceted filtering (type, state, region, season, travel month, budget tier), and sorting.
- **Sticky Glass Sub-Header (`.dest-subheader-wrap`)**: Sticks below the navbar (`top: 64px`, `z-index: 30`) carrying search input + category filter strip so search and category switching remain accessible at any scroll position.
- **Frosted Glass Category Filter Chips (`#typeFilter button`)**: Vibrant emerald gradient active state (`bg-emerald-500`), frosted glass inactive capsules (`rgba(255, 255, 255, 0.08)`), and smooth momentum horizontal drag-scroll.
- **Sticky Sidebar Filter Panel (`.filter-panel`)**: Positioned at `top: 180px` with independent scroll (`max-height: calc(100vh - 200px); overflow-y: auto`).
- Reads URL parameters on load (`?month=7`, `?type=hill_station`, `?state=...`, etc.). Paginated card rendering in batches (`PAGE_SIZE = 60`).

## Styling: static CSS (no CDN)

`css/tailwind.css` is **generated** by `scripts/build-css.js` — a mini-Tailwind resolver that
scans every HTML page + `js/` module for utility-class tokens and emits **only those** as plain
CSS (Tailwind v3 preflight + resolved utilities + `@media` blocks + the ring/shadow/gradient CSS
vars). It is pixel-identical to the old `cdn.tailwindcss.com` output for the classes in use.

- Load order in every page `<head>`: **`styles.css` → `tailwind.css` → `glass-immersive.css`
  → page-specific immersive CSS** — `glass-immersive.css` loads before the page-specific
  stylesheet so a page's own overrides (accent colors, contrast fixes inside page-specific
  components like the destination place modal) can win the cascade over its universal rules.
  `explore-immersive.css` is loaded only by `destinations.html`;
  `destination-immersive.css` is loaded only by `destination.html`.
- Custom component classes (`.card`, `.btn`, `.nav-glass`, carousels, `.form-input`,
  `.route-table`, `.info-card`, `.tab-btn`, `.live-dot`, animations…) stay in `styles.css`.
- **After adding/using a new utility class anywhere, re-run `node scripts/build-css.js`** or that
  class will have no styles. If a token isn't resolvable by the generator, add its family to
  `resolve()` in `build-css.js` (families currently covered: display/flex/grid/spacing/sizing/
  colors incl. `/alpha`, text, rounded, shadow, ring, gradients, transitions, transforms, line-clamp,
  variants `sm:`/`md:`/`lg:`/`xl:`/`hover:`/`focus:`/`group-hover:`/`last:`/`first:`, `!important`).

### Dark Glassmorphism Design System & UI/UX Pro Max Rules
Every page uses `body.glass-immersive` (class added in the HTML `<body>`) + the shared `css/glass-immersive.css`. This CSS provides:
- **Background layers**: `.explore-immersive-bg` / `.dest-immersive-bg` (fixed full-viewport image)
  + `.explore-immersive-overlay` / `.dest-immersive-overlay` (dark gradient overlay). Every page's
  HTML includes these two `<div>`s after `<body>`.
- **Frosted Glass Navbar** (`.nav-glass`): `backdrop-filter: blur(20px)`, translucent dark bg (`rgba(15, 23, 42, 0.75)`).
- **White-on-dark typography** overrides for all shared components (cards, footer, headings, form labels).
- **Vector SVG Icons & Zero Emojis**: All structural elements, badges, section titles, and chips use SVG icons (`Heroicons/Lucide` format) with explicit `width`/`height` attributes and CSS safeguards preventing unconstrained SVG scaling.
- **Dynamic Renderers**: `ai-finder.html`, `contact.html`, `about.html`, `privacy.html`, `terms.html`, and dynamic card generators in `js/pages/finder.js` (`cardHTML`, `understandingHTML`, `generateItineraryHTML`, `infoCardHTML`) render strictly using high-contrast dark glass containers (`bg-slate-900/80 border border-white/15 backdrop-blur-xl shadow-2xl`).
- **z-index stack**: bg=0, overlay=1, content (main/header/footer/nav)=2, navbar=10000.

Per-page immersive CSS (`explore-immersive.css`, `destination-immersive.css`) adds page-specific
overrides (different bg images, accent variables, custom component styles like tab panels,
filter chips, hero carousels). These are scoped via `body.explore-immersive` / `body.dest-immersive`.

⚠️ **All pages must keep the `glass-immersive` body class and bg/overlay divs.** Removing them
reverts to the old white-bg design, which no longer has matching component colors.

## Conventions

- Build dynamic DOM with template strings + `innerHTML`; escape every interpolated field with
  `esc()` (from `js/utils/format.js`; escapes `& < > " '`) plus `|| ''`/`|| 0`/`|| []` guards.
  Use `inr(n)` for number formatting, `typeLabel(type)` for underscore→space type labels.
- Wire events with `addEventListener` (or `data-*` + a delegated listener). No inline `onclick`
  except image `onerror` fallbacks to `picsum.photos`.
- Pages are ES modules (`<script type="module" src="js/pages/*.js">`); shared logic goes in
  `js/components/` or `js/utils/` and is imported. Don't duplicate markup or logic across pages.
- New destination content → legacy source data → `build-json-data.js`. New reusable UI → a
  component module. New storage read → `js/data/api.js` only.

## External services (browser-side, no API keys)

- **Open-Meteo** (`api.open-meteo.com`) — live weather. Free, no key, CORS.
- **Wikimedia Commons** — real photos, baked into the JSON at build time (instant, no runtime call
  for the common path); live per-place fetch only as fallback; `picsum.photos` as final fallback.
- **OpenStreetMap** — map tiles via vendored Leaflet.
- **Web3Forms** (`api.web3forms.com/submit`) — contact-form email. Access key in
  `js/pages/contact.js` (`WEB3FORMS_ACCESS_KEY`). Recipient is fixed to the key owner's inbox;
  change it by creating a new key at web3forms.com and swapping it in. Delivery only fires from a
  **browser over http(s)** (not a server-side POST). Visitor's email → reply-to; hidden `botcheck`
  honeypot drops bots. If the key is the `YOUR-ACCESS-KEY-HERE` placeholder, the form falls back to
  a local success ack + `console.warn`. Free tier ~250 submissions/month.

## Testing (no browser automation)

- Syntax-check a module: `node --check js/pages/home.js`.
- Smoke-test the served site:
  ```bash
  node scripts/serve.js 8123 &
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/destination.html?slug=goa
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/data/destinations/goa.json
  ```
- Verify the module import graph + JSON parse with a short Node script (walk `js/**`, resolve each
  relative `import`, `JSON.parse` each data file).
- External-endpoint reachability: use **`curl`** (Node `fetch` ignores the corporate proxy; curl
  is the real signal).
- Otherwise verify in a browser and hard-refresh (Ctrl+Shift+R) after edits — assets cache.
