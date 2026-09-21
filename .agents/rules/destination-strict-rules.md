# ExploreDesh — Strict Data Quality Rules

These rules are **mandatory** for every destination page. No exceptions.
They stack on top of `ui-ux-pro-max` skill rules.

> **Last updated: 2026-09-12 (Phase 39).** Sourcing hierarchy is updated per `.env.local` with **HD-First and Authentic-Image-First** priority. Authentic ground-truth sources (Wikimedia Commons 4K/8K, Google Places Photos, Flickr CC Travel Streams) and Ultra-HD photo engines (Pexels, Unsplash, Openverse, Museum 4K IIIF) are prioritized. Pixabay `/get/` session links, placeholder CDNs, and low-res thumbnails are strictly banned. **Cross-destination zero-collision is enforced** — use `scripts/verify_batch2.js` after any image update to verify 0 collisions across the full 66k+ URL repository index.

---

## Rule 1 — Destination Hero: 5 Unique HD / 4K Landscape Images

Every destination JSON must have **exactly 5 hero/gallery images**, all different.

- **HD-First & Authentic Priority Order (as per `.env.local`)**:
  1. **Pexels & Unsplash APIs**: True HD / 4K landscape photography (1920×1080 to 4608×2592, canonical `&w=1920` or `&auto=format&fit=crop&w=1920&q=85`). Zero rate-limiting, 100% reliable global CDNs.
  2. **Pixabay (Official API Only)**: Permanent `largeImageURL` (min 1600×900) via official API key.
  3. **Flickr CC & Openverse**: Authentic high-res travel streams (`_b.jpg` 1024px+, `_k.jpg` 2048px, `_o.jpg` 4K).
  4. **Museum 4K Open Access (CMA, AIC, Met, V&A)**: 3400px–3840px Ultra HD CC0 captures for historical architecture, forts, and palaces.
  5. **NASA Earth Imagery**: Ultra-HD satellite vistas for geographical landscapes, rivers, and mountain ranges.
  6. **Google Places Photos & Wikimedia Commons**: Ground-truth captures only when fully accessible without CDN rate limits (HTTP 429) or 404s.
- **Banned:** Wikimedia Commons direct hotlinks when rate-limited (`upload.wikimedia.org` HTTP 429/403/404), Pixabay `/get/` session links (expire / return HTTP 429), `picsum.photos`, placeholder CDNs, low-res thumbnails (< 1000px width)
- Each image must be **True HD / 4K Landscape quality** — minimum 1280px wide (strictly recommended 1920×1080 to 4608×2592), widescreen aspect ratio (`1.25` to `1.9`)
- Portrait orientation (< 1.0 ratio) and thin banner slices (< 300px height) are strictly prohibited
- All 5 must show the **actual destination** — no generic maps, district graphics, audio files, coins, or unrelated photos
- The `heroImage.src` must be identical to `gallery[0].src`
- **Proper Titles Mandatory**: Every item in `gallery[]` must have a meaningful, evocative, human-readable `title` that accurately describes the specific attraction, landmark, or scenic feature shown (e.g., `"Entrance Gate & Sanctuary Boardwalk"`, `"Yamuna River Wetland Vista"`, `"Migratory Waterfowl Over Okhla Barrage"`).
  - ❌ **Forbidden titles**: Generic placeholders like `"photo 1"`, `"image 2"`, `"slide 3"`, `"Okhla Sanctuary photo 2"`, `"view 1"`, or blank titles.
- The `gallery[]` array must contain all 5 unique URLs with descriptive `alt`, `title`, and `caption` fields

```json
"heroImage": {
  "src": "https://images.pexels.com/photos/XXXXXXX/...",
  "alt": "Descriptive alt text of the actual destination"
},
"gallery": [
  { "src": "unique-hd-url-1", "alt": "Okhla Bird Sanctuary Entrance Gate", "title": "Grand Entrance & Nature Trail", "caption": "Protected wetlands bordering the Yamuna River" },
  { "src": "unique-hd-url-2", "alt": "Yamuna River wetland waters at Okhla", "title": "Yamuna River Wetland Vista", "caption": "Serene morning mist over the river waters" },
  { "src": "unique-hd-url-3", "alt": "Migratory waterbirds resting on the marsh", "title": "Migratory Avian Haven", "caption": "Winter refuge for over 300 migratory bird species" },
  { "src": "unique-hd-url-4", "alt": "Watchtower overlooking the sanctuary reed beds", "title": "Observation Deck & Reed Beds", "caption": "Panoramic viewing platform for birdwatchers" },
  { "src": "unique-hd-url-5", "alt": "Lush sanctuary foliage along the walking trails", "title": "Verdant Forest Trail", "caption": "Canopy walk along the Yamuna biodiversity corridor" }
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

When searching, curating, and selecting images across all providers, strict content filtering is enforced:

- **MANDATORY / EXCLUSIVE FOCUS (Clean Architectural & Nature Vistas)**:
  - **Monuments & Heritage**: Ancient temples, historical forts, grand palaces, memorials, UNESCO world heritage sites.
  - **Scenery & Nature**: Panoramic landscapes, mountain vistas, waterfalls, lush valleys, pristine beaches, rivers, wildlife reserves.
  - **Architecture & Culture**: Magnificent facades, heritage courtyards, intricate stone carvings, aesthetic streetscapes, authentic cultural landmarks.

- **STRICTLY FORBIDDEN / ZERO-TOLERANCE REJECTION**:
  - ❌ **NO PERSON / NO PORTRAITS**: Absolutely zero individuals, tourist selfies, posing models (men, women, children), face close-ups, or humans as the subject.
  - ❌ **NO PEOPLE CROWDS**: Absolutely zero dense tourist mobs, crowded gatherings, congested markets, or human crowds obstructing the monuments, scenery, or architecture. The shot must showcase the destination cleanly.
  - ❌ **NO RANDOM IMAGES**: Absolutely zero unrelated filler, generic commercial stock, random objects, food/plates, hotel bedding, office interiors, traffic jams, clip art, logos, infographics, maps, flags.
  - ❌ **NO MODERN INFRASTRUCTURE / DISTRACTIONS**: Absolutely zero electric transmission towers, power lines, utility poles, high-voltage pylons, or substations marring scenic vistas. Zero modern clock towers falsely representing traditional temple gopurams.

---

## Rule 5 — 100% Indian Geographic Authenticity & Regional Fidelity

ExploreDesh is an authentic Indian exploration platform. Every single image asset MUST be geographically authentic to India and faithfully represent the destination's state and cultural landscape.

### 1. Zero Foreign Stock Guarantee (Strict Country Blacklist)
Stock photo APIs (Pexels, Unsplash) frequently return international results for generic terms like "temple", "wetlands", or "misty mountains". **Any photo from outside India is strictly prohibited.** Automated filters must reject photos tagged or describing:
- **South & Southeast Asia**: Sri Lanka (`colombo`, `polonnaruwa`, `haputale`, `kandy`, `galle`, `sigiriya`, `ingiriya`), Thailand, Vietnam, Cambodia (`angkor`, `siem reap`), Bali, Indonesia, Pakistan (`katas raj`, `lahore`), Bangladesh (`sylhet`, `dhaka`), Nepal, Bhutan.
- **Middle East & Eurasia**: Turkey / Türkiye (`kars`, `rize`, `isparta`, `sağrak`, `cappadocia`, `istanbul`), Egypt (`nile`, `cairo`), Greece (`nemea`, `athens`), Armenia (`dadivank`).
- **Americas**: USA (`minnesota`, `california`, `florida`, `texas`, `oregon`), Peru (`huacho`, `machu picchu`), Brazil, Mexico, Canada.
- **Europe & Oceania**: Germany (`husum`, `berlin`), Switzerland (`alps`), France (`corsica`, `lumio`), Italy, Spain, UK, New Zealand (`auckland`), Australia.

### 2. Strict State & Regional Cultural Alignment (Zero Cross-State Misattribution)
When sourcing proxies or nearby attractions, imagery MUST originate from the same state, district, or contiguous cultural-geographic zone in India:
- **Andhra Pradesh / Eastern Ghats**: Must feature authentic Andhra Pradesh heritage (Bojjannakonda Buddhist stupas/caves, Dravidian stone relief carvings, Araku Valley, Tuni, Visakhapatnam hills). Strictly forbidden: Himachal Pradesh, West Bengal, or Karnataka Hampi ruins.
- **Coastal Karnataka & Western Ghats**: Must feature Western Ghats Karnataka peaks (Kodachadri, Baba Budangiri, Agumbe), traditional Dravidian temple gopurams, and lush rain-forest foliage. Strictly forbidden: Tamil Nadu transmission towers, Kerala Munnar tea estates, or Maharashtra Khandala hills.
- **Kashmir Valley**: Must feature authentic Kashmir stone sanctums (Martand Sun Temple, Pandrethan, Shankaracharya, Avantipur), Kashmir mountain meadows (Gurez, Pir Panjal), and Pampore saffron crocus fields. Strictly forbidden: Cambodia, Greece, Germany, or Karnataka Melukote B&W photos.
- **Northern Indian Wetlands (Haryana / NCR)**: Must feature genuine northern Indian migratory bird sanctuary photography (Keoladeo, Bharatpur, Sultanpur, Najafgarh - Bar-headed geese, Painted storks, Spoonbills, Kingfishers). Strictly forbidden: American, Peruvian, or Thai wetlands.
- **Northeast India (Arunachal Pradesh)**: Must feature Ziro Valley terraced rice paddies, Lower Subansiri pine hills, and Himalayan rainforests. Strictly forbidden: Turkey or European alpine valleys.
- **Karnataka Heritage (Kalyana Chalukya / Hoysala)**: Must feature authentic Karnataka temple stone architecture (Gadag, Lakkundi, Aihole, Badami, Pattadakal, Halebidu). Strictly forbidden: Auckland NZ statues.

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
| **10** | **100% Indian Geographic Authenticity: Zero foreign stock & zero cross-state misattributions** | **ExploreDesh Strict (Phase 40)** |
| **11** | **Subject Curation: Monuments, scenery & architecture only (No persons/crowds/towers/vehicles)** | **ExploreDesh Strict** |
| **12** | **Authentic Ground-Truth + HD First Priority (as per `.env.local`)** | **ExploreDesh Strict** |
| **13** | **Proper Titles & Captions: descriptive, non-generic title for every gallery image** | **ExploreDesh Strict** |

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
- ❌ **NO Persons / Portraits / Selfies**: Photos with people, tourists, posing models, or face close-ups.
- ❌ **NO People Crowds**: Dense tourist crowds, congested gatherings, or mobs obstructing the scenery or monument.
- ❌ **NO Random / Unrelated Images**: Stock filler, unrelated cities/states, hotel beds, food plates, office interiors, or foreign landmarks.
- ❌ **Politically Sensitive Content**: Official government/military figures at border checkpoints.
- ❌ **Duplicate URLs**: Any URL appearing 2+ times in the same file or in any other destination file in the 66k+ index.
