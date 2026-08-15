# 🗺️ IndiaExplore — Roadmap & Plan

The working plan for the project: where it stands, what's next, and what it takes to go
public. Keep this current — it's the single place to see status at a glance.

Last updated: 2026-08-14.

## 2026-08-14 media-restoration source of truth

- Preserved all 2,389 destinations / 14,001 places / 9,756 stays; no records were deleted.
- Restored old media for 89 destination covers, 4,196 places, and 9,425 stays while preserving the
  six verified online destination replacements. Primary URL coverage is now 100% in all three
  catalog categories.
- Legacy-restored URL coverage is not verified real-photo coverage. Exact identity, visual quality,
  licensing/source stability, scans, generic stock, and stale URLs remain a catalog-wide audit.
- Future repairs must use legal online-hosted HD URLs and must not download image files locally.
  Work in verified batches and never replace one of the six protected repairs with old data.
- This section supersedes older statements below claiming 100% verified real-photo coverage.

---

## ✅ Done (current state)

- **100% destination primary URL coverage (restored 2026-08-14)** — all 2,389 destination
  summaries/details now have an online primary image. Six replacements are newly verified;
  legacy-restored media is not yet a 100% real/entity-accurate photography claim.
- **UI/UX Pro Max Destination Detail Redesign (2026-08-03)** — Upgraded "Top Places to Visit" in `js/pages/destination.js` to full cover-card grid layout with rating badges, category tags, distance, and 2-line descriptions; removed redundant "Underrated Gems Nearby" section and cleaned navbar CTA.
- **Canonical-only destination preservation (2026-08-01)** — `build-json-data.js` now keeps all
  34 destinations outside the legacy/bulk sources (28 hand-added + 6 Delhi-NCR) in both the browse
  manifest and AI Finder index. Added read-only `--check` and non-destructive `--search-only` modes;
  repaired search coverage from 2,361 to all 2,389 destinations without rewriting enriched details.
- **2,389 destinations** across 36 states/UTs (**14,001 places, 9,756 stays**) — catalog integrity verified.
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
- **Historical background-agent handoff (2026-08-01; superseded).** Earlier photo and hotel
  worklists are retained in [AUDIT.md](AUDIT.md) for provenance only. Do not resume from their old
  counts; recompute any future authenticity worklist from the current canonical JSON.
- **Historical photo/hotel agent result (2026-08-01; no longer current).** See the dated audit log
  for its original figures; the 2026-08-14 restoration source of truth governs current coverage.
- **Strict cleanup pass (historical)** — `scripts/enforce-real-photos-only.js` removed known
  placeholders and non-photo media. The 2026-08-14 owner-requested old-data restoration later
  restored complete URL coverage, so its legacy fields must not be described as universally verified.
- **28 Hand-Added & Enriched Offbeat Destinations** — Added and enriched 28 high-demand offbeat gems (Bangaram Island, Dawki, Gurudongmar Lake, Hanle, Chopta, Gandikota, Dhanushkodi, Mawlynnong, Lonar Crater, Chembra Peak, Gurez Valley, Unakoti, Sandakphu, Chitrakote Falls, Shekhawati, Dholavira, Zanskar Valley, Polo Forest, Tranquebar, Jibhi, Bhedaghat, Valparai, Tamhini Ghat, Loktak Lake, Dhanaulti, Mandu, Daringbadi, etc.) with custom rich itineraries, real verified photos, place categories, and transport routes.
- **36 States & UTs Matrix & Ladakh Normalization** — Normalized `d.state` strings for Ladakh, updated `meta.states` in `data/destinations/index.json`, synchronized `STATE_ZONE` and `STATE_ALIASES` in `js/data/taxonomy.js`, and validated filter coverage across all 36 States & UTs (`node scripts/validate-filters.js`).
- **UI/UX Pro Max System & High Contrast Overhaul (2026-07-31)** — Comprehensive dark glassmorphism redesign across `ai-finder.html`, `contact.html`, `about.html`, `privacy.html`, and `terms.html`. Upgraded headers, forms, result cards (`cardHTML`), understanding panel (`understandingHTML`), custom itinerary timeline renderer (`generateItineraryHTML`), and site-info cards (`infoCardHTML`) to dark glass containers (`bg-slate-900/80 border-white/15 backdrop-blur-xl shadow-2xl`) with high-contrast text (`text-white` titles, `text-slate-300` body text) and vector SVG icons (`Heroicons/Lucide`) with explicit width/height safeguards.
- **Glowing Mint Pill Buttons ("View All")** — Styled `.section-link` ("View all →") and `.btn-outline` as dark glass pills with glowing mint borders (`#34d399`) and crisp white text.
- **2-Tier Header Stacking & Bounded Sticky Navigation** — Navbar elevated to `z-index: 10000` with dark glass blur background (`rgba(6, 9, 14, 0.92)` + `blur(24px)`), and sticky section tab bar (`#destNavContainer`) bounded inside `.dest-tabs-container` so it sits at `top: 64px` and un-sticks cleanly above *Similar Destinations* and *Footer*.
- **Clean Navbar Header** — Unified navigation links across all pages (`Home`, `Destinations`, `AI Trip Finder`, `About`, `Contact`) and removed right-side "Plan Trip" button.
- **Vanilla JS** throughout (Alpine.js fully removed). Runs over **http(s)**, not `file://`
  (ES6 modules + `fetch()`ed JSON require it) — `node scripts/serve.js` → http://localhost:8080.
- **Live weather** (Open-Meteo) on every destination, auto-refreshing.
- **Pre-stored online image URLs** — every destination has media references in JSON, so hero
  carousels need no live search API; legacy-restored image accuracy remains an audit backlog.
- **Hero photo carousel** + **place-detail modal** carousel — both use stored online image URLs.
- **Filters** — type / budget / state / travel-month + sort, with a scroll-safe sidebar;
  the Hills/Beaches/Heritage nav links highlight correctly on the Explore page.
- **Travel-month coverage normalised** — every month returns an accurate, multi-category set
  (summer hills, monsoon Ghats/Himalaya, year-round pilgrimage). Min any month: 47 destinations.
- **Interactive Monthly Highlights & 5-Image Showcase Carousel** (`index.html`) — Auto-detects current month (July with `NOW` badge), 12-month tab selector pills (`Jan`–`Dec`), dynamic title/subtitle/button, and an interactive photo showcase carousel.
- **Auto-Selected Month Filter & Active Filter Chips** (`destinations.html`) — `destinations.html?month=7` auto-selects Travel Month filter in dropdown and renders an `Active Filters` bar (`📅 Travel Month: July (✕)`) with single-click clear control.
- **Destination Detail Overview Carousel** (`destination.html`) — destination pages render stored
  hero/attraction media with slide counter, dots, arrows, and auto-play controls.
- **Clean Root Workspace & `stubs/` Folder Architecture** — All 2,389 redirect HTML files organized neatly inside `stubs/` directory (`stubs/<slug>.html`), leaving the project root clean; `scripts/serve.js` updated with Windows case-insensitive path resolution.
- **Company pages** — About / Privacy / Terms / Contact, with shared nav/footer + mobile nav.
- **Contact email automation** — the Contact form delivers real email via **Web3Forms**
  (no backend; set `WEB3FORMS_ACCESS_KEY` in `contact.html`). Honeypot blocks bots.
- **Sign-in removed** everywhere (was a non-functional waitlist stub).
- **Reference doc** — `docs/DESTINATIONS.md` lists all 2,389 by state with months + price/night.
- **Price filter fixed** — the "Price / Night" filter now matches destinations that actually
  *offer a stay in the selected band* (stay price-range overlap) instead of a ceiling on the
  cheapest price.
- **QA pass (all pages)** — consolidated non-filterable types into canonical `DESTINATION_TYPES`; `esc()` HTML-escaping; verified place modal locks background scroll; cleaned redirect stubs.
- **Static Tailwind CSS** — `css/tailwind.css` generated by `scripts/build-css.js`.
- **Bulk-ingest pipeline** (`scripts/bulk/`) plus canonical-only preservation → **2,389 total across 36 states/UTs**.
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
