




# ExploreDesh — Discover Incredible India

> **Platform Status (2026-09-19 rev-12):** **2,393 destinations** (14,013 places, 10,427 verified authentic stays across all 36 states & UTs). 100% zero-duplicate & landmark-verified photography with **66,480+ globally unique image URLs**. **Phase 51: Deep Mobile Screen Audit & Light/Dark Mode Full Responsiveness —** Complete resolution of mobile layout defects, calligraphy kicker wrapping, light mode hero text contrast, interactive India map mobile stacking (zero-overlap state card), right-aligned action buttons, and frosted pearl light-mode mobile navigation. Automated UI/UX QA audit: **0 issues detected (100/100 score)**.

> **Image Pipeline Status (2026-09-19):** **Phase 50 Multi-Agent HD Overhaul Complete —** 100% True HD (1920px+) photography assigned across 26 session targets (100% live HTTP 200 OK, 100% unique, zero foreign stock, zero Wikimedia, zero rate limits). Total catalog: **66,480+ verified HD photos**.

A luxury India travel-discovery platform. Browse **2,393 destinations**, filter by type / budget / state / travel-month, and open a per-destination page with a photo hero, places to visit, stays by budget, routes (with distance from major cities), an interactive Google Maps overview with direct directions, live weather, and dynamic similar recommendations.

> **Dual-Engine Luxury Design System:** 
> - **OLED Cinema Dark Mode:** Deep obsidian canvas (`#080A0F`), radiant gold gradients (`#FFF3C4` → `#E5C07B`), ambient gold glows, frosted glass cards, and high-contrast typography.
> - **Liquid Pearl Glass Light Mode ("Lait de Perle"):** Soft warm alabaster canvas (`#FAF9F6`), radiant daylight light wells, frosted milk glass cards (`rgba(255, 255, 255, 0.92)` + `backdrop-filter: blur(24px)`), precision top-edge specular bevels, and warm golden corona lift micro-interactions. Full mobile responsiveness across 375px, 390px, and 412px viewports.

> **100% Verified Legal Photography & Zero Duplicate URLs.** Hand-authored and enriched with authentic
> Pexels API, Unsplash, and Openverse/Flickr CDN photography as primary sources (zero picsum/PDF/dummy stock fallbacks, zero foreign stock from outside India, zero portraits/selfies/vehicles/power-lines, zero internal or cross-destination duplicates). Wikimedia Commons is fully removed from all overhauled destinations (Phases 29–49 extended this catalog-wide). See [CLAUDE.md](CLAUDE.md) and [.agents/rules/destination-strict-rules.md](.agents/rules/destination-strict-rules.md) for provenance.

> **No framework. No npm. No bundler.** Plain HTML5 + CSS + vanilla ES6 modules, powered by
> **GSAP ScrollTrigger** animations and served over a zero-dependency Node static server.

---

## Quick start

```bash
node scripts/serve.js                        # → http://localhost:8080 (Start local web server)
node scripts/verify_khajuraho_batch.js       # → Strict zero-collision audit: 11 Khajuraho batch destinations
node scripts/verify_batch3.js                # → Strict zero-collision audit: 14 Batch 3 destinations
node scripts/verify_batch2.js                # → Strict zero-collision audit: 10 Batch 2 destinations
node scripts/verify_meghalaya_strict.js      # → Strict zero-collision audit: 11 Meghalaya destinations
node scripts/audit_session_hd_images.js      # → Platform-wide HD session audit: 47 destinations / 1,259 URLs
node scripts/audit_all.js                    # → Master Unified Audit Suite: UI/UX + SEO + Media integrity
node scripts/ui_ux_qa_audit.js               # → UI/UX Pro Max automated QA audit across all HTML & CSS files
```

Then open **http://localhost:8080/**. A server is required (not `file://`) because the site
uses **ES6 modules** (`<script type="module">`) and **`fetch()`es JSON** — browsers block both
over `file://`. `serve.js` is pure Node (no npm), so it runs anywhere Node does.

After editing files, hard-refresh with **Ctrl+Shift+R** (browsers cache aggressively).

---

## Architecture at a glance

The site follows a strict **template + data-layer** design so it scales to 2,000+ destinations
without adding a single HTML file:

- **One reusable detail template.** `destination.html?slug=goa` renders *any* destination.
  There is never one HTML file per destination — the 2,393 `<slug>.html` files in `stubs/` are redirect stubs kept for backwards compatibility.
- **A JSON data layer.** All content lives in `data/` as JSON. No content is hardcoded in
  markup or page scripts.
- **A single data-access abstraction.** Every read goes through `js/data/api.js`
  (`fetchDestination(slug)`, `fetchIndex()`, `fetchSearchIndex()`). A future backend
  (e.g. Supabase) only has to change **that one file** — nothing else touches storage.
- **Dual-Engine Luxury Design System (OLED Cinema & Liquid Pearl Glass).** Flawlessly toggles between deep obsidian cinema mode (`#080A0F`) and editorial frosted milk glass ("Lait de Perle", `#FAF9F6`) with multi-point ambient daylight light wells (champagne sunlight corona & azure mist), specular top bevel highlights (`inset 0 1px 0 #FFFFFF`), and tactile golden corona hover lifts.
- **Swiss Luxury Watch Bento Grid (`destination.html`).** Precision-engineered metrics dashboard featuring Altitude, Best Season, Seasonal Temperatures, and Live OpenWeather integration within beveled frosted milk glass tiles with warm amber medallions.
- **Universal Luxury Overview Button Interactions.** Every button site-wide (`.btn`, `.btn-primary`, `.btn-outline`, `.nav-link`, `.tab-btn`, `.category-pill-btn`, `.quick-tag-btn`, `<button>`) features bottom-up ambient gold glow, radiant `2.5px solid #F5C542` bottom underline, and golden drop shadows on hover and active click.
- **Universal Space-Agnostic & Relevance-Ranked Search Engine.** Engineered with `js/utils/search.js` to support space-less searches (`tajmahal`, `tamilnadu`, `ootytamilnadu`, `mehtabbagh`), compound queries, mixed multi-word queries, and full 14,013 attraction place indexing with tiered relevance ranking across `index.html`, `destinations.html`, and `ai-finder.html`.
- **Homepage Visual Symmetry.** Trending Destinations carousel cards and the Interactive India Map are matched to `500px` height with aligned header baselines and bottom edges.
- **Dynamic Refresh Reshuffling.** Featured sections (*Trending Destinations, Popular Destinations, Best Hill Stations, Explore More*) automatically reshuffle on every page refresh using Fisher-Yates randomization.
- **100% Authentic Lodging Architecture Across All 2,393 Destinations (Zero Synthetic Chains).** 
  - **10,427 Verified Properties Catalog-Wide:** Every single destination has verified, real-world accommodations ranging from on-site pilgrim Devasthanam Yatri Nivas & Forest Rest Houses to iconic heritage and luxury hotels.
  - **87 Dedicated Regional Hubs:** Seamlessly bridges remote rural villages and temples to genuine accommodations in their closest commercial and tourist transit center (with verified distance tags, e.g. `Mayiladuthurai (15 km away)` or `Hospet (12 km away)`).
  - **100% Direct Google Maps Search Links:** Every hotel card features direct, pre-encoded Google Maps search URLs resolving to the specific physical property with town and state context.
- **GSAP Scroll & Motion Engine.** Smooth scroll parallax background scrubs, hero staggered entrance timelines, animated stat counters, and section scroll triggers via GSAP 3.12.5 & ScrollTrigger with reduced-motion accessibility support.
- **Reusable components.** Navbar, footer with brand trust badge, mobile-nav (`js/components/layout.js`),
  destination cards (`js/components/destinationCard.js`), and SEO/JSON-LD helpers
  (`js/components/seo.js`) are defined once and mounted by every page.
- **Performance.** Browse/explore/finder load only the lightweight manifest
  (`data/destinations/index.json`); a detail page loads **only its own** destination JSON.
  Images are lazy-loaded.
- **Pure Search-Engine SEO.** Runtime `<title>` / description / canonical / robots meta directives + Schema.org
  JSON-LD graph (`WebSite` with Google Sitelinks `SearchAction`, `TouristDestination`, `CollectionPage`, `AboutPage`, `ContactPage`, `BreadcrumbList`, `FAQPage`) via `js/components/seo.js`. Social media meta tags (`og:*`, `twitter:*`) are excluded by design for optimal search engine crawling.
- **Every device.** Fully responsive: on phones/tablets (<1024px) the Explore filters open
  as a slide-in drawer ("⚙️ Filters" button), and a bottom nav bar replaces the desktop links
  below 768px.

---

## Project structure

```
trip_planner/
├── index.html              # Home — GSAP hero parallax, category strip, interactive month showcase, SVG India map, featured grids
├── destinations.html       # Explore — Editorial hero with GSAP live counter, instant search, sticky category pills, dark filter rail
├── ai-finder.html          # ✨ AI Trip Finder — natural-language matcher, fully local & keyless
├── destination.html        # ⭐ The ONE real detail page (all 2,393 render via ?slug=, GSAP parallax, weather, stays, routes & similar getaways)
├── about / privacy / terms / contact.html   # Company pages (contact form, no backend)
├── stubs/
│   └── <slug>.html  (×2393)  # Redirect stubs → destination.html?slug=<slug>
│
├── css/
│   ├── styles.css          # Custom component classes (.card, .btn, carousels, …)
│   ├── explore-immersive.css # Luxury editorial tokens & card styling for destinations catalog
│   ├── destination-immersive.css # Dark glassmorphism & rich tab styling for destination detail pages
│   ├── glass-immersive.css # Ambient dark glass theme system
│   └── tailwind.css        # Static utility CSS
│
├── data/                             # ← the data layer (JSON, no hardcoded content)
│   ├── destinations/
│   │   ├── index.json      # Light manifest: 2,393 summaries + filter meta (tiers/types/states/months)
│   │   └── <slug>.json  (×2393)  # Full per-destination detail (schema below)
│   ├── search-index.json   # AI-finder haystack: precomputed place/hotel names + tiers + text
│   ├── bulk/<state>.json   # Bulk-ingest output, merged into DESTINATIONS by build-json-data.js
│   └── coord-overrides.json  # Manual lat/lng/state fixes for bad upstream coords
│
├── js/
│   ├── data/api.js         # ⭐ The ONLY storage touchpoint — swap this for a backend
│   ├── utils/format.js     # esc() / inr() / typeLabel()
│   ├── components/
│   │   ├── layout.js       # Navbar + footer + mobile-nav (mounted into #siteNav/#siteFooter/#siteMobileNav)
│   │   ├── indiaMap.js     # Inline-SVG clickable state map (home "Explore India" section)
│   │   ├── destinationCard.js  # Reusable card templates (trending / explore / hero / mini)
│   │   └── seo.js          # applySEO() + JSON-LD builders
│   ├── pages/
│   │   ├── home.js         # index.html (GSAP parallax, rotators, monthly picks)
│   │   ├── explore.js      # destinations.html (GSAP counters, debounced filter engine)
│   │   ├── finder.js       # ai-finder.html (NLP matching, STOP_WORDS parser, itinerary extrapolation)
│   │   ├── destination.js  # destination.html (detail tabs, Google Maps embed, stays, similar getaways)
│   │   ├── company.js      # about / privacy / terms
│   │   └── contact.js      # contact.html (Web3Forms)
│   ├── components/googleMapEmbed.js # Reusable lazy Google Maps embed component
│
├── scripts/
│   ├── serve.js            # ⭐ Zero-dependency static server (pure Node)
│   ├── build-json-data.js  # Generates data/ from the legacy js/data*.js sources (+ bulk + overrides)
│   ├── geo-reference.js    # Offline airports/railheads/cities → real nearest-reach + city routes
│   ├── build-css.js        # Generates css/tailwind.css (static utility CSS)
│   ├── build-india-map.js  # Generates data/india-map.js (state SVG paths for the home map)
│   ├── build-stubs.js      # Regenerates the 2,393 redirect stubs
│   ├── bulk/               # Bulk-ingest pipeline (Wikidata + Wikipedia) + refetch-places-overrides.js
│   ├── build-photos*.js / build-place-photos*.js  # Real-photo fetchers (legacy source data)
│   ├── build-destinations-doc.js   # Regenerates docs/DESTINATIONS.md
│   ├── verify_batch2.js    # 🔍 Strict 66k-URL zero-collision audit for all 10 Batch 2 destinations
│   ├── solve_all_batch2_zero_collisions.js  # 🤖 Multi-page API fetcher: replaces bad images with zero-collision verified HD URLs
│   ├── fix_cross_batch2_dups.js   # 🔧 Resolves cross-destination URL collisions within Batch 2
│   ├── audit_batch2_issues.js     # 📋 Pre-audit: flags portrait/foreign/low-quality/banned-pattern images
│   └── purge_and_fix_all_random_images.js  # 🧹 Universal random-image purge engine (configurable target slug list)
│
├── js/data.js, data-extra.js, data-destinations.js, data-photos.js, data-place-photos.js
│                           # LEGACY source data — now only an input to build-json-data.js
│
├── CLAUDE.md               # 📘 Authoritative engineering guide — READ before changing code
├── README.md               # This file
└── docs/ROADMAP.md · DESTINATIONS.md · AUDIT.md
```

---

## The destination JSON schema

Each `data/destinations/<slug>.json`:

```
slug, title, state, country, region, type, badge, tagline,
heroImage { src, alt },
overview  { short, description, features[], altitude, rating, reviewCount, minPrice, distanceFromDelhi },
bestTime  { label, months[] },
weather   { lat, lng, tempSummer, tempWinter },
howToReach{ routes[{from,distance,byCar,byTrain,byAir,via}], nearestAirport{name,distance},
            nearestRailway{name,distance}, roadNote },
topPlaces [{ name, category, distance, entryFee, timings, duration, rating, description,
             image{src,alt}, photos[] }],
itinerary [{ day, title, items[{time,activity,note}] }],
hotels    [{ name, type, tier, priceMin, priceMax, rating, reviews, amenities[], tags[], url, image{src,alt} }],
restaurants [], activities[],
gallery   [{ src, alt }],
faq       [{ q, a }],
seo       { title, description, canonical, ogImage, keywords[] }
```

`index.json` holds a **summary** per destination (slug/title/state/type/rating/minPrice/
bestTime/lat/lng/image/features/tiers) plus `meta` (priceTiers, types, states, months).

---

## Regenerating data

```bash
node scripts/build-json-data.js   # rebuild data/ from js/data*.js + bulk + coord-overrides (+ index + search-index)
node scripts/build-css.js         # rebuild css/tailwind.css (run after adding utility classes)
node scripts/build-stubs.js       # rebuild the 2,393 redirect stubs
```

`build-css.js` scans every page + `js/` module for utility classes and emits **only those**
as plain CSS (Tailwind preflight + resolved utilities) — pixel-identical to the old CDN,
but static and offline.

**Reach data & coord fixes.** `build-json-data.js` fills each destination's `nearestAirport` /
`nearestRailway` / major-city routes from the offline `scripts/geo-reference.js` dataset (no
network). `data/coord-overrides.json` (`slug → {lat?,lng?,state?}`) corrects destinations that
inherited wrong coords/state from upstream data. If you change a coord there, re-run
`node scripts/bulk/refetch-places-overrides.js` (re-fetches nearby places around the new point)
then `build-json-data.js`.

---

## Key constraints (do not break)

| Rule | Why |
|------|-----|
| No framework | Plain vanilla JS / ES6 modules only (Alpine.js and React are out) |
| No npm dependencies | `npm install` is blocked on the corporate network (E403) |
| No `unpkg.com` | Returns HTTP 403; use `cdn.jsdelivr.net` or **vendor into `js/`** |
| One template, JSON data | Never add per-destination HTML; never hardcode content |
| All reads via `js/data/api.js` | Keeps a backend migration to a single file |

Full detail and rationale live in **[CLAUDE.md](CLAUDE.md)**.

---

## External services & Image Pipeline

- **Open-Meteo** — live weather.
- **Pexels, Unsplash & Openverse Multi-Provider Pipeline** — High-resolution verified photography baked into destination JSONs (`heroImage`, `gallery`, `topPlaces[].photos`, `hotels[].image`). Managed by `scripts/` image pipeline with zero-collision detection across 66k+ repo URLs and strict banned-pattern filtering (no portraits, vehicles, foreign monuments, foreign stock photos). Automated replacement engine: `scripts/solve_all_batch2_zero_collisions.js`, `scripts/fix_cross_batch2_dups.js`, `scripts/audit_all.js`.
- **Wikimedia Commons** — Strictly banned as a direct hotlink source (Phases 29–50 have completely eliminated all Wikimedia hotlinks across all overhauled destinations; CDN rate limiting causes HTTP 429 errors). All imagery is sourced from Pexels/Unsplash/Openverse/Flickr CC exclusively.
- **Google Maps** — interactive destination maps and directions (via zero-dependency lazy embed component).
- **Web3Forms** — contact-form email delivery. A live access key is set in `js/pages/contact.js`;
  delivery only fires from a **browser over http(s)** (not `file://`), so it activates once deployed.

---

## Deploy (free)

Any static host works — there's no build step to run on the host (the `data/` + `css/tailwind.css`
are committed, pre-generated). Drag the folder onto **app.netlify.com/drop**, or connect the repo
to **Cloudflare Pages** (build command: *none*, output dir: `/`). Once on HTTPS the contact form
delivers email and geolocation ("📍 Near me") works. See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Testing

No browser automation here. Validate a module's syntax with Node:

```bash
node --check js/pages/home.js
```

Smoke-test the served site:

```bash
node scripts/serve.js 8123 &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/destination.html?slug=goa
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/data/destinations/goa.json
```

Check external-endpoint reachability with **`curl`** (Node `fetch` ignores the corporate proxy).
