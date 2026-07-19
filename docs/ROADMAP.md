# 🗺️ IndiaExplore — Roadmap & Plan

The working plan for the project: where it stands, what's next, and what it takes to go
public. Keep this current — it's the single place to see status at a glance.

Last updated: 2026-07-19.

---

## ✅ Done (current state)

- **2,355 destinations** across 35 states/UTs (13,800+ places, 9,500+ stays) — data-integrity
  verified (no dup ids, all required fields, all have weather/map coords, all have redirect stubs).
  108 are hand-curated with baked real photos; ~2,247 were bulk-ingested from Wikidata + Wikipedia
  (real coords/places/descriptions/distances; heuristic temps + nearest airport-railway; photo
  pass pending). See the provenance note in [CLAUDE.md](../CLAUDE.md).
- **Vanilla JS** throughout (Alpine.js fully removed). Runs over **http(s)**, not `file://`
  (ES6 modules + `fetch()`ed JSON require it) — `node scripts/serve.js` → http://localhost:8080.
- **Live weather** (Open-Meteo) on every destination, auto-refreshing.
- **Pre-stored real photos** — every one of the 108 destinations has **≥5 real Wikimedia
  photos** (641 total) baked into `js/data-photos.js`, so the hero carousel is **instant &
  accurate with no live API call**. Built by `scripts/build-photos.js` (+ `-fill.js`).
- **Hero photo carousel** + **place-detail modal** carousel — both ≥5 real images.
- **Filters** — type / budget / state / travel-month + sort, with a scroll-safe sidebar;
  the Hills/Beaches/Heritage nav links highlight correctly on the Explore page.
- **Travel-month coverage normalised** — every month returns an accurate, multi-category set
  (summer hills, monsoon Ghats/Himalaya, year-round pilgrimage). Min any month: 47 destinations.
- **Company pages** — About / Privacy / Terms / Contact, with shared nav/footer + mobile nav.
- **Contact email automation** — the Contact form delivers real email via **Web3Forms**
  (no backend; set `WEB3FORMS_ACCESS_KEY` in `contact.html`). Honeypot blocks bots.
- **Sign-in removed** everywhere (was a non-functional waitlist stub).
- **Reference doc** — `docs/DESTINATIONS.md` lists all 108 by state with months + price/night.
- **Price filter fixed** — the "Price / Night" filter now matches destinations that actually
  *offer a stay in the selected band* (stay price-range overlap) instead of a ceiling on the
  cheapest price, which made every tier from "Good" up return all 108. Luxury/Extra-Luxury
  now narrow correctly (70 / 23).
- **QA pass (all pages)** — (a) consolidated 12 destinations that used non-filterable types
  (`scenic`/`nature`/`cultural`) into the 6 canonical `DESTINATION_TYPES` so every destination
  is reachable by the type filter; (b) `esc()` HTML-escaping + missing-field guards added to
  `index.html` and `destinations.html` (was `destination.html`-only); (c) place-modal photo
  carousel no longer overwrites the wrong place's photos on fast switching, and arrow/dot input
  during the "Loading…" window can't act on stale slides; (d) Explore type/month filter buttons
  are built once and only toggle active state, so the type row's scroll position survives
  typing; (e) deep-link params validated (`?type=`/`?state=` ignored if unknown, `?maxPrice=`
  guarded against NaN); (f) the home "Ultra Luxury" card now actually filters (`?maxPrice=30000`); (g) the Contact "Follow Us" social links
  (Instagram/Twitter/Facebook) rendered white-on-white — the dark-footer `.footer-link` class
  reused on a light card — and are now restyled to the primary color.
- **Contact form is live** — a real `WEB3FORMS_ACCESS_KEY` is set in `contact.html`, so
  submissions deliver to the key owner's inbox once the site is on http(s). Recipient is fixed to
  the key's email on the free plan (swap the key to change it); `api.web3forms.com` is reachable
  through the corporate proxy.
- **Destinations reference regenerable** — `docs/DESTINATIONS.md` is now rebuilt by
  `node scripts/build-destinations-doc.js` (previously hand-maintained) and reflects the
  corrected destination types + normalised travel months.
- **Fixes shipped** — real HTML escaping in `esc()`; price always matches a real stay;
  place modal locks background scroll; redirect stubs cleaned (`<\/script>` → `</script>`).
- **Static Tailwind CSS** — the in-browser `cdn.tailwindcss.com` compiler is gone; `css/tailwind.css`
  is now generated (pixel-identical) by `scripts/build-css.js`. Re-run after using a new utility class.
- **Bulk-ingest pipeline** (`scripts/bulk/`) — **run to completion across all 36 state keys**
  (2026-07-11): +2,247 destinations merged over the 108 legacy ones → **2,355 total across 35
  states/UTs** (Lakshadweep yielded 0 — quality gate found no real places in radius). Real coords,
  nearby attractions, descriptions, and place/Delhi distances from Wikidata + Wikipedia;
  quality-gated (≥1 real place), serial/resumable/checkpointed. Merged by `build-json-data.js` via
  `data/bulk/<state>.json`. **Photo passes complete (2026-07-18):** `fetch-photos.js` ran to
  completion — 1,831/2,355 real heroes, 10,848/13,827 real place photos, galleries 100%.
  Remaining picsum = Commons has no image for those names (marked `photoTried`, auto-skipped).
- **Real reach data (nearest airport/railway + city routes)** — every bulk destination that had a
  placeholder `nearestAirport` now resolves real values from the offline `scripts/geo-reference.js`
  dataset (~80 airports, ~80 railheads, 40 cities; Haversine + road-factor). The detail page's
  **"Distance from major cities" is now a filterable dropdown** (`#reachCity` in
  `js/pages/destination.js`). The 108 hand-authored destinations keep their existing reach.
- **Broken-coordinate fixes** — 14 destinations inherited wrong coords/state from upstream Wikidata
  (worst: Fort Madhogarh's Wikidata point WAS Delhi's coord → "2 km from Delhi"). Corrected via
  `data/coord-overrides.json`, verified online. `build-json-data.js` applies them up front
  (recomputes `distanceFromDelhi`, re-derives reach, fixes state). Their **nearby places were then
  re-fetched** at the corrected coords via `scripts/bulk/refetch-places-overrides.js`.
- **Clickable review counts** — the stats-bar and per-hotel review counts on the detail page now
  link out to a Google reviews search for that destination/hotel name.
- **Mobile filter drawer** (2026-07-15) — the Explore sidebar now doubles as a slide-in drawer
  below `lg` (1024px): a "⚙️ Filters" trigger with active-filter-count badge sits next to the
  sort select; the drawer closes via ✕ / backdrop tap / Esc / a "Show N destinations" apply
  button. Same markup both ways — CSS-only presentation switch (`.filter-sidebar.open` in
  `styles.css`), wiring in `js/pages/explore.js`. Also fixed the **641–767px nav gap**:
  `.mobile-nav` hid at 641px while desktop nav links only appear at `md:` (768px), leaving
  tablets with no navigation — both breakpoints now 768px.
- **Explore filter arrangement** (2026-07-17) — sidebar reordered to the documented priority
  ("type, state, budget, month"): Region → State → Price/Night → Season → Travel Month
  (location → budget → time); budget was previously buried last. Markup-only reorder in
  `destinations.html`.
- **Weather auto-refresh 60s → 10 min** (2026-07-17) — first half of P0 #2 shipped;
  label updated ("refreshes every 10 min").
- **AI Finder vibe synonyms** (2026-07-17) — "honeymoon" (and 22 other user-language vibe
  words: hidden, foodie, solo, party, couples, kids…) returned nothing because they never
  appear in the wiki-derived search text. `VIBE_SYNONYMS` in `js/pages/finder.js` expands
  them to data-measured related words — "honeymoon" now matches 507 destinations.
- **Home page redesign** (2026-07-19) — added an interactive **"Explore India" SVG map**
  (`js/components/indiaMap.js` + generated `data/india-map.js` via `scripts/build-india-map.js`)
  and a **"Best This Month"** rail; an **8-chip category strip** (Mountains, Beaches, Heritage,
  Wildlife, Road Trips, Temples, Adventure, Camping) that now spreads all eight on desktop
  (was a scroll container hiding the last four) and swipes on mobile; expanded the **footer** to
  four link columns + a Popular Destinations tag row; and hero social-proof avatars. **Removed**
  the trust-badges + "Never Miss Amazing Destinations" newsletter panel (and its orphaned home.js
  IIFEs). Fixed the **hero background tiling** bug — the init set the `background` shorthand, which
  reset `background-size:cover`, so an undersized banner-crop tiled; now a single fixed full-bleed
  image with `background-repeat:no-repeat` (`css/styles.css` + `js/pages/home.js`).

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
10. **Replace template hotel names** (e.g. "Radisson <City>") with specific real hotels.
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
