# ExploreDesh — Strict Data Quality Rules

These rules are **mandatory** for every destination page. No exceptions.
They stack on top of `ui-ux-pro-max` skill rules.

> **Last updated: 2026-09-06 (Phase 19).** External photo APIs (Pexels, Unsplash, Openverse/Flickr) are **mandatory primary sources**. Wikimedia Commons is strictly **last resort**. All image alt text and titles must have HTML entities decoded and tags stripped.

---

## Rule 1 — Destination Hero: 5 Unique HD / 4K Landscape Images

Every destination JSON must have **exactly 5 hero/gallery images**, all different.

- **Preferred sources (in priority order): Pexels, Unsplash, Openverse (Flickr CDN)**
- Fallback/last resort: Wikimedia Commons — strictly if external photo APIs have no suitable authentic match
- **Banned:** Pixabay `/get/` session links (expire / return HTTP 429), `picsum.photos`, placeholder CDNs
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
- All photos must show the **actual place** being described — not the hero image recycled
- **Preferred sources: Pexels, Unsplash** (use authenticated permanent CDN links only)
- **Banned:** Pixabay `/get/g…` session links — always use `pixabay.com` `largeImageURL` if Pixabay must be used

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

## Rule 3 — Zero Duplicate URLs Across the Entire File

No image URL may appear **more than once** in the entire destination JSON.

Checked across:
- `heroImage.src`
- `gallery[].src`
- `topPlaces[].image.src`
- `topPlaces[].photos[]` (every single photo URL)

**Verification check to run before saving:**
```js
const allUrls = [
  dest.heroImage.src,
  ...dest.gallery.map(g => g.src),
  ...dest.topPlaces.map(p => p.image.src),
  ...dest.topPlaces.flatMap(p => p.photos)
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
| **6** | **Hero must have exactly 5 unique HD images** | **ExploreDesh Strict** |
| **7** | **Each nearby place must have exactly 3 unique images** | **ExploreDesh Strict** |
| **8** | **Zero duplicate image URLs anywhere in the file** | **ExploreDesh Strict** |
| **9** | **Subject Curation: Monuments, scenery & architecture only (No persons/selfies/politics/unrelated)** | **ExploreDesh Strict** |
| **10** | **Pexels/Unsplash first; Wikimedia only as absolute last resort** | **ExploreDesh Strict (Phase 15)** |

---

## Approved Legal Image Sources & Format Standards
 
| Provider | Priority | Quality / Resolution Rule | Licensing & Safety |
| :--- | :--- | :--- | :--- |
| **Pexels** | ✅ **Primary** | Full HD (`cs=tinysrgb&dpr=2&w=1280` or `original`), never `cs=tiny` | Free commercial / personal license (Zero attribution required) |
| **Unsplash** | ✅ **Primary** | Full HD (`auto=format&fit=crop&w=1280&q=80`), never low-res thumbs | Free Unsplash License (Zero attribution required) |
| **Wikimedia Commons** | ⚠️ **Fallback only** | Full HD original (`imageinfo/url` or `iiurlwidth=1280`), never SVG/PDF/maps | CC-BY, CC-BY-SA, Public Domain — use ONLY when Pexels/Unsplash have no suitable match |
| **Pixabay** | ⚠️ **Avoid** — use `largeImageURL` ONLY | High-res (`largeImageURL`, 1280px+). **NEVER** use `/get/g…` session links (expire with HTTP 429) | Pixabay Content License |
| **Google Places Photos** | 🔵 Optional | Max-width 1200+ Place Photo URLs | Google Maps Platform licensed (Author attribution preserved) |
| **Openverse** | 🔵 Optional | High-res original URLs with CC0 / CC-BY metadata | Creative Commons verified & indexed |
| **Mapillary** | 🔵 Optional | Street-level HD geotagged captures or viewer embed | CC-BY-SA 4.0 street view imagery |

---

## What Counts as a Violation

- Using photos with prominent persons, selfies, close-up faces, or portrait poses
- Using politically sensitive photos (government officials, military at sensitive borders)
- Using unrelated images or incorrect location / mismatched landmark photos
- Using a district map or generic Wikipedia article image as hero
- Recycling the hero image URL as a place's image
- `photos: ["url1", "url1", "url1"]` — same URL repeated
- Gallery with fewer than 5 entries
- Places with fewer than 3 photos
- Any URL appearing 2+ times across the file
- Low-res thumbnail URLs (< 800px width) instead of full HD
- `picsum.photos`, `via.placeholder`, or `placeholder.com` URLs
- Pixabay `/get/g…` session URLs (expire, return HTTP 429)
- Wikimedia images used when a suitable Pexels/Unsplash match exists
