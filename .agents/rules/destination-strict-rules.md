# ExploreDesh — Strict Data Quality Rules

These rules are **mandatory** for every destination page. No exceptions.
They stack on top of `ui-ux-pro-max` skill rules.

---

## Rule 1 — Destination Hero: 5 Unique HD / 4K Landscape Images

Every destination JSON must have **exactly 5 hero/gallery images**, all different.

- Sources allowed: **Wikimedia Commons** (original full-resolution), **Pexels**, **Unsplash**, **Pixabay**, **Google Places Photos**, **Openverse**, **Mapillary**
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
- Sources allowed: **Pexels**, **Unsplash**, **Wikimedia Commons**, **Pixabay**, **Google Places Photos**, **Openverse**, **Mapillary**

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
| **9** | **Subject Curation: Monuments, scenery & architecture only (No persons/selfies/unrelated)** | **ExploreDesh Strict** |

---

## Approved Legal Image Sources & Format Standards
 
| Provider | Quality / Resolution Rule | Licensing & Safety |
| :--- | :--- | :--- |
| **Pexels** | Full HD (`cs=tinysrgb&dpr=2&w=1280` or `original`), never `cs=tiny` | Free commercial / personal license (Zero attribution required) |
| **Unsplash** | Full HD (`auto=format&fit=crop&w=1280&q=80`), never low-res thumbs | Free Unsplash License (Zero attribution required) |
| **Wikimedia Commons** | Full HD original (`imageinfo/url` or `iiurlwidth=1280`), never SVG/PDF/maps | CC-BY, CC-BY-SA, Public Domain (Authentic destination landmarks) |
| **Pixabay** | High-res (`largeImageURL` or `webformatURL` with 1280px+) | Pixabay Content License (Commercial & personal safe) |
| **Google Places Photos** | Max-width 1200+ Place Photo URLs | Google Maps Platform licensed (Author attribution preserved) |
| **Openverse** | High-res original URLs with CC0 / CC-BY metadata | Creative Commons verified & indexed |
| **Mapillary** | Street-level HD geotagged captures or viewer embed | CC-BY-SA 4.0 street view imagery |

---

## What Counts as a Violation

- Using photos with prominent persons, selfies, close-up faces, or portrait poses
- Using unrelated images or incorrect location / mismatched landmark photos
- Using a district map or generic Wikipedia article image as hero
- Recycling the hero image URL as a place's image
- `photos: ["url1", "url1", "url1"]` — same URL repeated
- Gallery with fewer than 5 entries
- Places with fewer than 3 photos
- Any URL appearing 2+ times across the file
- Low-res thumbnail URLs (< 800px width) instead of full HD
- `picsum.photos`, `via.placeholder`, or `placeholder.com` URLs

