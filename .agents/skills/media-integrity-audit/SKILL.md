---
name: media-integrity-audit
description: "Repository Media, Photography Quality, and Destination Invariant Audit skill for ExploreDesh. Audits 2,393 destinations and 66,000+ photo URLs across strict dataset invariants: exactly 5 HD gallery images, primary hero synchronization (heroImage.src === gallery[0].src), 3 distinct photos per nearby place, zero internal duplicate URLs, zero cross-destination duplicate collisions across the 66k+ repository catalog, zero Wikimedia hotlinks, zero Pixabay session URLs, zero placeholder domains, and live HTTP 200 reachability. Run whenever verifying image quality, auditing batches, or fixing photo defects."
---

# Media & Destination Integrity Audit Skill (`/media-integrity-audit`)

This skill audits ExploreDesh's media catalog across all 2,393 destinations to enforce photography standards, eliminate duplicate URLs, and verify visual invariants.

## When to Run This Skill

- After adding or updating destination JSON files in `data/destinations/`.
- After running image replacement agents (`scripts/multi_agent_photo_replacer.js`, `scripts/multi_agent_8_destinations_fixer.js`).
- When auditing catalog-wide duplicate collisions or missing photos.
- Before synchronizing `data/destinations/index.json`.

---

## Automated Execution Commands

### 1. Repository-Wide Integrity Audit
Audits all 2,393 destination JSON files for gallery length, hero synchronization, place photos, internal duplicates, and cross-destination contamination:

```bash
node scripts/final-repository-audit.js
```

### 2. Session HD Resolution & Liveness Audit
Audits high-priority target destinations for live HTTP 200 reachability, true HD resolution ($\ge 1280\text{px}$), and landscape aspect ratio:

```bash
node scripts/audit_session_hd_images.js
```

### 3. Cross-Destination Collision Scanner
Scans the 66,000+ URL repository index to pinpoint any image reused across multiple destinations:

```bash
node scripts/images/cross-destination-audit.js
```

---

## 6 Strict Media Invariants

### 0. Rule 0 — Strict Photographic Truth & Zero Mislabeling Guard
- **Photographic Truth**: Never accept fuzzy search results from stock engines depicting an unrelated monument (e.g. Kumbhalgarh for Maharashtra forts, Badami for Uttarakhand temples, or foreign castles/churches).
- **Metadata Mismatch Matrix**: Strictly enforce the Mismatch Rules in `.agents/rules/destination-strict-rules.md` Rule 0 before assigning any stock photos.
- **Monument Ground-Truth**: For specific temples, churches, shrines, and forts, images must portray the **actual, authentic structure** from verified ground-truth archives.
- **Honest Regional Landscape Titles**: High-definition Pexels/Unsplash photos may be used for natural features only when honestly described as regional topography.

### 1. Rule 1 — Hero & Gallery Parity (5 Unique HD Images)
- **Count**: Exactly 5 unique HD image URLs in `gallery[]` array.
- **Hero Alignment**: `heroImage.src` must match `gallery[0].src` identically, and `heroImage.alt` must match `gallery[0].alt`.
- **Widescreen Aspect Ratio**: Strictly landscape orientation ($1.25 \le \text{aspect ratio} \le 1.9$). Portrait photos are prohibited for heroes to prevent awkward cropping inside the 64vh hero container.
- **Minimum Resolution**: Width $\ge 1280\text{px}$ (recommended $1920\text{px}$ Ultra HD).
- **Titles & Metadata**: Every gallery item must have an evocative, descriptive `title`, `alt`, and `caption` accurately naming the landmark or monument.

### 2. Rule 2 — Nearby Places (3 Photos per Place)
- **Preserve Existing Places**: Keep valid attractions already curated in `topPlaces[]`.
- **Photo Count**: Every place must possess:
  - 1 card thumbnail (`image.src` and `image.alt`).
  - Exactly 3 photos in `photos[]`.
- **Subject Accuracy**: Photos must faithfully reflect the specific attraction, historical site, or regional landscape.

### 3. Rule 3 — Zero Duplicate URLs (Repo-Wide Zero-Collision)
- **Intra-Destination**: 0 duplicates within any destination file (except `heroImage.src === gallery[0].src`).
- **Inter-Destination**: Disjoint sets across all 2,393 destinations. No photo URL may appear in more than one destination.
- **Disjoint Sets**: Gallery photos, place thumbnails, and place photos must not overlap within the file.

### 4. Rule 4 — Authentic Legal Photo APIs
- **Tier 1 (Ultra HD Global CDNs)**: **Pexels API** (`&w=1920&q=85`) and **Unsplash API** (`&auto=format&fit=crop&w=1920&q=85`).
- **Strictly Banned Sources**:
  - ❌ **Wikimedia Commons hotlinks** (subject to HTTP 429 rate limiting, 403 forbidden, and missing file moves).
  - ❌ **Pixabay session URLs** (`/get/g...` expiring links that return HTTP 429).
  - ❌ **Placeholder domains** (`picsum.photos`, `via.placeholder.com`, `dummyimage.com`).
  - ❌ **Non-photo assets** (SVGs, PDFs, maps, diagrams, census charts, flags, coins).

### 5. Rule 5 — Pure Scenic & Architectural Subjects
- **Target Subjects**: Authentic monuments, ancient temples, rock-cut architecture, scenic valleys, waterbodies, and wildlife.
- **Strict Rejections**: Zero selfies, zero tourist crowds obstructing monuments, zero food plates, zero office interiors, zero vehicles/tractors. Zero electric transmission towers, power lines, or modern clock towers falsely representing traditional temple gopurams.

### 6. Rule 6 — 100% Indian Geographic Authenticity & Regional Fidelity
- **Zero Foreign Stock**: Strict regex rejection of any photo referencing Sri Lanka (`colombo`, `polonnaruwa`, `haputale`, `ingiriya`), Turkey/Türkiye (`kars`, `rize`), USA (`minnesota`), New Zealand (`auckland`), Thailand, Vietnam, Cambodia (`angkor`), Greece, Egypt, Germany, Pakistan, Bangladesh, or Peru.
- **Strict State & Regional Alignment**:
  - Andhra Pradesh: Must feature authentic AP Eastern Ghats (Araku, Tuni, Visakhapatnam), Bojjannakonda rock-cut Buddhist stupas, and Dravidian stone reliefs. Never Himachal or West Bengal.
  - Western Ghats Karnataka: Must feature Western Ghats Karnataka peaks (Kodachadri, Baba Budangiri), Agumbe, and Dravidian gopurams. Never Tamil Nadu power lines or Munnar.
  - Kashmir Valley: Must feature Kashmir stone sanctums (Martand, Pandrethan, Shankaracharya), Kashmir mountain meadows, and Pampore saffron fields. Never Cambodia or Greece.
  - Northern Indian Wetlands: Must feature Northern Indian wetland waterfowl (Keoladeo, Bharatpur, Sultanpur, Najafgarh). Never Minnesota or Peru.
  - Northeast India: Must feature Ziro Valley terraced rice paddies and pine hills. Never Turkey.

---

## Remediation Workflow

When repairing destinations flagged by the audit:
1. Use the multi-agent photo replacer to source verified, live HTTP 200, zero-collision, India-only Ultra HD photos:
   ```bash
   node scripts/multi_agent_photo_replacer.js
   ```
2. Synchronize the master catalog index:
   ```bash
   node scripts/sync-bulk-from-destinations.js
   ```
3. Re-run `node scripts/final-repository-audit.js` to verify 100% compliance.
