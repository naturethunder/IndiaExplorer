# ExploreDesh — Strict Data Quality Rules

These rules are **mandatory** for every destination page. No exceptions.
They stack on top of `ui-ux-pro-max` skill rules.

> **Last updated: 2026-09-12 (Phase 39).** Sourcing hierarchy is updated per `.env.local` with **HD-First and Authentic-Image-First** priority. Authentic ground-truth sources (Wikimedia Commons 4K/8K, Google Places Photos, Flickr CC Travel Streams) and Ultra-HD photo engines (Pexels, Unsplash, Openverse, Museum 4K IIIF) are prioritized. Pixabay `/get/` session links, placeholder CDNs, and low-res thumbnails are strictly banned. **Cross-destination zero-collision is enforced** — use `scripts/verify_batch2.js` after any image update to verify 0 collisions across the full 66k+ URL repository index.

---

## Rule 1 — Destination Hero: 5 Unique HD / 4K Landscape Images

Every destination JSON must have **exactly 5 hero/gallery images**, all different.

- **HD-First & Authentic Priority Order (as per `.env.local`)**:
  1. **Google Places Photos & Wikimedia Commons**: Ground-truth authentic 4K/8K captures of the exact destination/monument.
  2. **Pexels & Unsplash**: True HD / 4K landscape photography (1920×1080 to 4608×2592).
  3. **Flickr CC & Openverse**: Authentic high-res travel streams (`_b.jpg` 1024px+, `_k.jpg` 2048px, `_o.jpg` 4K).
  4. **Museum 4K Open Access (CMA, AIC, Met, V&A)**: 3400px–3840px Ultra HD CC0 captures for historical architecture, forts, and palaces.
  5. **NASA Earth Imagery**: Ultra-HD satellite vistas for geographical landscapes, rivers, and mountain ranges.
  6. **Pixabay (API Only)**: Permanent `largeImageURL` (min 1600×900) via official API key.
- **Banned:** Pixabay `/get/` session links (expire / return HTTP 429), `picsum.photos`, placeholder CDNs, low-res thumbnails (< 1000px width)
- Each image must be **True HD / 4K Landscape quality** — minimum 1280px wide (recommended 1920×1080 to 4608×2592), widescreen aspect ratio (`1.25` to `1.9`)
- Portrait orientation (< 1.0 ratio) and thin banner slices (< 300px height) are strictly prohibited
- All 5 must show the **actual destination** — no generic maps, district graphics, audio files, coins, or unrelated photos
- The `heroImage.src` must be identical to `gallery[0].src`
- The `gallery[]` array must contain all 5 unique URLs with descriptive `alt`, `title`, and `caption` fields

```json
"heroImage": {
  "src": "https://images.pexels.com/photos/XXXXXXX/...",
  "alt": "Descriptive alt text of the actual destination"
},
"gallery": [
  { "src": "unique-hd-url-1", "alt": "..." },
  { "src": "unique-hd-url-2", "alt": "..." },
  { "src": "unique-hd-url-3", "alt": "..." },
  { "src": "unique-hd-url-4", "alt": "..." },
  { "src": "unique-hd-url-5", "alt": "..." }
]
```

---

## Rule 2 — Nearby Places: 3 Unique Images per Place

Every entry in `topPlaces[]` must have **exactly 3 unique images**.

- Each place `image.src` must be unique across the **entire destination file**
- Each place `photos[]` array must contain **exactly 3 different URLs**
- **HD-First & Authentic Sources (in priority order)**:
  1. **Google Places Photos API & Wikimedia Commons**: Direct authentic photos of the specific nearby place (min 1200px to 4K).
  2. **Pexels & Unsplash**: High-definition curated landscape/monument photos.
  3. **Flickr CC Travel Streams & Openverse**: Authentic high-res captures (`_b.jpg` 1024px+).
  4. **Museum 4K Open Access (CMA, AIC, Met, V&A)**: Historical forts, temples, and palaces.
  5. **Pixabay (API Only)**: Permanent `largeImageURL` only.
- **Banned:** Pixabay `/get/g…` session links (expire with HTTP 429), placeholder CDNs, thumbnail URLs (< 1000px width), low-res crops

```json
{
  "name": "Place Name",
  "image": {
    "src": "unique-url-this-place-only",
    "alt": "Descriptive alt of this specific place"
  },
  "photos": [
    "unique-photo-url-1",
    "unique-photo-url-2",
    "unique-photo-url-3"
  ]
}
```

---

## Rule 3 — Zero Duplicate URLs Across the Entire File AND Entire Repository

No image URL may appear **more than once** in the entire destination JSON, AND no URL
may appear in **any other destination file** (cross-destination zero-collision).

Checked across:
- `heroImage.src`
- `gallery[].src`
- `topPlaces[].image.src`
- `topPlaces[].photos[]` (every single photo URL)

**Cross-destination audit command:**
```bash
node scripts/verify_batch2.js
# Indexes 66,000+ URLs from all 2,393 destination files
# Flags any URL appearing in more than one destination
```

**In-file verification check to run before saving:**
```js
const allUrls = [
  dest.heroImage.src,
  ...dest.gallery.map(g => g.src),
  ...dest.topPlaces.map(p => p.image.src),
  ...dest.topPlaces.flatMap(p => p.photos.map(ph => ph.src || ph))
];
const dupes = allUrls.filter((u, i) => allUrls.indexOf(u) !== i);
// dupes must be empty []
```

---

## Rule 4 — Subject & Visual Curation: Monuments, Scenery & Architecture Only

When searching and selecting images across all providers, strict content filtering must be applied:

- **MANDATORY / PREFERRED SUBJECTS**:
  - **Monuments & Heritage**: Ancient temples, historical forts, grand palaces, memorials, UNESCO world heritage sites.
  - **Scenery & Nature**: Panoramic landscapes, mountain vistas, waterfalls, lush valleys, pristine beaches, rivers, wildlife reserves.
  - **Architecture & Culture**: Magnificent facades, heritage courtyards, intricate stone carvings, aesthetic streetscapes, authentic cultural landmarks.
  
- **STRICTLY FORBIDDEN / AUTOMATIC REJECTION**:
  - ❌ **People / Portraits / Selfies**: Photos with prominent individuals, tourist selfies, close-up faces, or people posing and obstructing the view.
  - ❌ **Politicians / Politically Sensitive**: Official government/military photos at sensitive borders (e.g. PM/army at Line of Control). These are doubly rejected.
  - ❌ **Unrelated / Wrong Images**: Stock photos of unrelated locations, wrong cities/states, generic modern office interiors, conference rooms, city traffic jams.
  - ❌ **Generic Non-Travel Assets**: Food / plate close-ups, hotel bedding, random object close-ups, clip art, logos, infographics, maps, flags.

---

## Combined Priority Order (Full Strict Rules)

| Priority | Rule | Source |
|----------|------|--------|
| 1 | `no-emoji-icons` — SVG icons only, never emojis | ui-ux-pro-max |
| 2 | `alt-text` — every image has a descriptive alt text | ui-ux-pro-max |
| 3 | `color-contrast` — 4.5:1 minimum ratio | ui-ux-pro-max |
| 4 | `touch-target-size` — 44×44px minimum on all clickables | ui-ux-pro-max |
| 5 | `cursor-pointer` — on all interactive elements | ui-ux-pro-max |
| **6** | **Hero must have exactly 5 unique HD landscape images** | **ExploreDesh Strict** |
| **7** | **Each nearby place must have exactly 3 unique images** | **ExploreDesh Strict** |
| **8** | **Zero duplicate image URLs anywhere in the file** | **ExploreDesh Strict** |
| **9** | **Zero cross-destination URL collisions across all 2,393 files (66k+ URLs)** | **ExploreDesh Strict** |
| **10** | **Subject Curation: Monuments, scenery & architecture only (No persons/selfies/politics/vehicles/foreign-monuments)** | **ExploreDesh Strict** |
| **11** | **Authentic Ground-Truth + HD First Priority (as per `.env.local`)** | **ExploreDesh Strict (Phase 39)** |

---

## Approved Legal Image Sources & Format Standards (as per `.env.local`)

| Provider | Priority Tier | Quality / Resolution Rule | Licensing & Role |
| :--- | :--- | :--- | :--- |
| **Google Places Photos API** | 🥇 **Tier 1 — Ground Truth** | High-res Place Photos (max-width 1600+), exact GPS match | Google Maps Platform licensed (Authentic real-world place ground-truth) |
| **Wikimedia Commons** | 🥇 **Tier 1 — Ground Truth** | Full HD / 4K / 8K original (`iiurlwidth=1920` or full original URL). Min 1600×900. Strictly reject SVG, PDF, maps, audio. | CC-BY, CC-BY-SA, Public Domain (Unrivaled authentic ground truth for Indian temples, forts, waterfalls, monuments) |
| **Flickr CC Travel Streams** | 🥇 **Tier 1 — Ground Truth** | High-res Flickr CDN (`_b.jpg` = 1024px+, `_k.jpg` = 2048px, `_o.jpg` = 4K). Never low-res thumbnails. | CC-BY / CC0 verified authentic on-the-ground travel & street photography |
| **Pexels API** | 🥈 **Tier 2 — Ultra HD 4K** | Full HD / 4K (`cs=tinysrgb&dpr=2&w=1920` or `original`). Min 1920×1080. Never `cs=tiny`. | Free commercial / personal license (Zero attribution required; stunning landscape vistas) |
| **Unsplash API** | 🥈 **Tier 2 — Ultra HD 4K** | Full HD / 4K (`w=2400&auto=format&fit=crop&q=85`). Min 1920×1080. Never low-res thumbs. | Free Unsplash License (Zero attribution required; authentic artistic travel perspectives) |
| **Openverse API / Public Search** | 🥈 **Tier 2 — Ultra HD 4K** | Verified CC-BY / CC0 high resolution imagery from 700M+ Creative Commons index | CC0 / CC-BY cultural and travel collections |
| **The Met Open Access** | 🏛️ **Tier 3 — Museum 4K** | 4K ultra-high resolution photography of Indian palaces, forts, and Rajput/Mughal architecture | CC0 Public Domain Dedication (Authentic historical architecture) |
| **Art Institute of Chicago (AIC)** | 🏛️ **Tier 3 — Museum 4K** | Dynamic 3840px 4K IIIF generator (`/full/3840,/0/default.jpg`) for Indian heritage architecture | CC0 Public Domain Dedication |
| **Cleveland Museum of Art (CMA)** | 🏛️ **Tier 3 — Museum 4K** | Unlimited 3400px+ Ultra HD CC0 photography of Indian royal heritage and temples | CC0 Public Domain Dedication |
| **Victoria and Albert Museum (V&A)** | 🏛️ **Tier 3 — Museum 4K** | Unlimited 2048px+ IIIF photography of Indian historical architecture | CC0 / Educational / Open Access |
| **NASA Earth & Satellite Imagery** | 🛰️ **Tier 3 — Satellite 4K** | Unlimited Ultra-HD satellite vistas of the Himalayas, rivers, coasts, and natural landscapes | Public Domain NASA Imagery |
| **Pixabay API** | ⚠️ **Tier 4 — Secondary Stock** | High-res (`largeImageURL` or `fullHDURL`, min 1600×900). **NEVER** use `/get/g…` session links | Pixabay Content License (Allowed via official API key only) |

---

## Strictly Banned Domains & Assets

- ❌ **Pixabay Session URLs (`pixabay.com/get/g…`)**: Temporary session URLs expire quickly and return HTTP 429 errors.
- ❌ **Placeholder CDNs**: `picsum.photos`, `via.placeholder`, `placeholder.com`, `dummyimage.com`, `placehold.co`, `loremflickr.com`.
- ❌ **Low-Resolution Thumbnails (< 1000px width)**: Any thumbnail URLs (`cs=tiny`, `_s.jpg`, `_t.jpg`, `_m.jpg`, `w=300`, `w=400`) instead of Full HD (min 1280px, target 1920px+).
- ❌ **Non-Photographic / Document Scans**: Vector `.svg`, document `.pdf`, audio files, scanned census sheets, heraldic emblems, logos, flags, maps.
- ❌ **Foreign / Mismatched Locations**: Photos of foreign monuments/destinations (Angkor Wat, Bali, Thailand, Europe, China, etc.) falsely used for Indian destinations.
- ❌ **Prominent Face / Portrait / Selfie Content**: Photos dominated by tourists or models obstructing the monument or landscape.
- ❌ **Politically Sensitive Content**: Official government/military figures at border checkpoints.
- ❌ **Duplicate URLs**: Any URL appearing 2+ times in the same file or in any other destination file in the 66k+ index.
