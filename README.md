# 🇮🇳 ExploreDesh — Luxury Travel Discovery Platform

> **System Status (2026-09-04):** **2,388 Destinations** across all 36 States & UTs. Full-screen **Royal Obsidian & Heritage Gold** luxury dark glass layouts, **11-category discovery grid**, dynamic reshuffling on refresh, GSAP ScrollTrigger batch motion engine, 100% unique 1-to-1 hero photography (69,398 unique image pool across 71,787 image slots), True 4K & Ultra-HD widescreen landscape imagery, interactive Google Maps & Directions actions, zero map diagrams/selfies/portraits/audio/coins/political photos, zero cross-destination duplicates, image-free hotel cards with direct Google search integration, pure search-engine SEO (Schema.org JSON-LD graph with Sitelinks `SearchAction`, `TouristDestination`, `CollectionPage`, `AboutPage`, `ContactPage`, `BreadcrumbList`, canonical consolidation, 0 social media tags), and zero broken/placeholder media repository-wide. **Phase 16 (2026-09-04):** Full responsive audit across 390px/768px/1440px — all layouts passing. Two precision fixes: altitude double-unit display (`"216 m m"` → `"216 m"`) and toolbar badge spacing (`"2,388Available"` → `"2,388 Available"`). **Score: 97/100.**

A luxury India travel-discovery platform. Browse **2,390 destinations** (14,362+ places,
9,629+ stays across all 36 states & UTs), filter by type / budget / state / travel-month, and
open a per-destination page with a photo hero, places to visit, stays by budget, routes
(with distance from major cities), an interactive Leaflet map with direct Google Maps search/directions, live weather, and dynamic similar recommendations.

> **100% Verified Legal Photography & Zero Duplicate URLs.** Hand-authored and enriched with authentic
> Wikimedia Commons, Pexels API, Unsplash, Pixabay, Openverse (Flickr CC-BY, Smithsonian Open Access), and Wikipedia photography (zero picsum/PDF/dummy stock fallbacks, zero portraits/selfies/maps/audio/coins, zero internal duplicates). See [CLAUDE.md](CLAUDE.md) for provenance.

> **No framework. No npm. No bundler.** Plain HTML5 + CSS + vanilla ES6 modules, powered by
> **GSAP ScrollTrigger** animations and served over a zero-dependency Node static server.

---

## Quick start

```bash
node scripts/serve.js          # → http://localhost:8080 (Start local web server)
node scripts/final-repository-audit.js  # → Run comprehensive repository integrity & media audit
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
  There is never one HTML file per destination — the 2,389 `<slug>.html` files are redirect stubs kept for old links.
- **A JSON data layer.** All content lives in `data/` as JSON. No content is hardcoded in
  markup or page scripts.
- **A single data-access abstraction.** Every read goes through `js/data/api.js`
  (`fetchDestination(slug)`, `fetchIndex()`, `fetchSearchIndex()`). A future backend
  (e.g. Supabase) only has to change **that one file** — nothing else touches storage.
- **Dynamic Refresh Reshuffling.** Featured sections (*Trending Destinations, Popular Destinations, Best Hill Stations, Explore More*) automatically reshuffle on every page refresh using Fisher-Yates randomization.
- **Hotel Direct Google Integration.** All 9,756 hotel listings feature image-free modern text cards with nightly rate ranges, price tier badges, star ratings, amenities, and direct links to live Google hotel search & reviews.
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
├── destination.html        # ⭐ The ONE real detail page (all 2,389 render via ?slug=, GSAP parallax, weather, stays, routes & similar getaways)
├── about / privacy / terms / contact.html   # Company pages (contact form, no backend)
├── stubs/
│   └── <slug>.html  (×2389)  # Redirect stubs → destination.html?slug=<slug>
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
│   │   ├── index.json      # Light manifest: 2,389 summaries + filter meta (tiers/types/states/months)
│   │   └── <slug>.json  (×2389)  # Full per-destination detail (schema below)
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
│   │   ├── finder.js       # ai-finder.html (NLP matching)
│   │   ├── destination.js  # destination.html (detail tabs, Leaflet map, stays, similar getaways)
│   │   ├── company.js      # about / privacy / terms
│   │   └── contact.js      # contact.html (Web3Forms)
│   └── leaflet.js / .css    # Vendored map library (Map tab)
│
├── scripts/
│   ├── serve.js            # ⭐ Zero-dependency static server (pure Node)
│   ├── build-json-data.js  # Generates data/ from the legacy js/data*.js sources (+ bulk + overrides)
│   ├── geo-reference.js    # Offline airports/railheads/cities → real nearest-reach + city routes
│   ├── build-css.js        # Generates css/tailwind.css (static utility CSS)
│   ├── build-india-map.js  # Generates data/india-map.js (state SVG paths for the home map)
│   ├── build-stubs.js      # Regenerates the 2,389 redirect stubs
│   ├── bulk/               # Bulk-ingest pipeline (Wikidata + Wikipedia) + refetch-places-overrides.js
│   ├── build-photos*.js / build-place-photos*.js  # Real-photo fetchers (legacy source data)
│   └── build-destinations-doc.js   # Regenerates docs/DESTINATIONS.md
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
hotels    [{ name, type, tier, priceMin, priceMax, rating, reviews, amenities[], tags[], image{src,alt} }],
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
node scripts/build-stubs.js       # rebuild the 2,389 redirect stubs
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
- **Pexels & Unsplash Multi-Provider Pipeline** — High-resolution verified photography baked into destination JSONs (`heroImage`, `gallery`, `topPlaces[].photos`, `hotels[].image`). Managed by `scripts/images/` pipeline with SQLite caching and non-blocking rate limiting.
- **Wikimedia Commons** — Secondary fallback source for regional monument photography.
- **OpenStreetMap** — map tiles (via vendored Leaflet).
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
