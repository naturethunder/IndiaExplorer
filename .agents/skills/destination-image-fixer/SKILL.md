---
name: destination-image-fixer
description: "Autonomous agent skill for auditing, retrieving, and repairing destination hero images, gallery images, and place images across IndiaExplorer destination JSON files. Enforces 5 HD unique hero/gallery images, 3 unique place photos per place, and 0 duplicate URLs across the entire file AND across the entire 66k+ URL repository index (cross-destination zero-collision guarantee)."
---

# Destination Image Fixer — Agent Skill (Phase 38 Updated)

This skill defines the autonomous image acquisition and quality enforcement workflow for ExploreDesh destination dataset.

## Core Rules

1. **Rule 1 — Hero & Gallery (5 Unique HD Images)**
   - Exactly 5 unique HD image URLs in `gallery[]` array.
   - Primary `heroImage.src` must match `gallery[0].src` or be a valid HD image.
   - Minimum resolution width 1280px (recommended 1920px+ landscape).
   - Every gallery item must have descriptive `alt` and `title` text.
   - Widescreen aspect ratio (1.25–1.9). Portrait orientation strictly prohibited.

2. **Rule 2 — Nearby Places (Flexible Count, 3 Photos per Existing Place)**
   - The number of places in `topPlaces[]` is **non-mandatory / flexible** (can be 1–8+).
   - **Preserve existing places**: Do NOT force-add or auto-generate dummy places to hit an artificial number. Keep whatever valid places already exist.
   - For every place that exists:
     - 1 unique `image.src` (card thumbnail).
     - Exactly 3 unique image URLs in `photos[]`.
     - Photos must accurately reflect the specific place.
     - Descriptive `alt` and `title` text.

3. **Rule 3 — Zero Duplicate URLs (File-Wide AND Repo-Wide)**
   - No image URL may be reused across distinct items in the same destination JSON.
   - **NEW (Phase 38): Cross-destination zero-collision** — no URL in a destination being patched may already exist in any of the 2,393+ other destination files. Use `verify_batch2.js` to audit (indexes 66k+ URLs).
   - Disjoint sets for gallery vs place cards vs place photos.

4. **Rule 4 — Authentic Legal Sourcing (HD-First & Ground-Truth Priority as per `.env.local`)**
   - Priority Source Order:
     1. **Tier 1 (Authentic Ground Truth)**: **Google Places Photos API** (geotagged place photos) & **Wikimedia Commons** (4K/8K authentic Indian monuments, temples, forts, waterfalls; min 1600×900) & **Flickr CC Travel Streams** (`_b.jpg` 1024px+, `_k.jpg` 2048px, `_o.jpg` 4K).
     2. **Tier 2 (Ultra HD Curated Photo APIs)**: **Pexels API** (`original` or `dpr=2&w=1920`) & **Unsplash API** (`w=2400&auto=format&fit=crop&q=85`) & **Openverse Public Search** (700M+ CC library).
     3. **Tier 3 (Museum 4K Open Access)**: **Cleveland Museum of Art (CMA)** (3400px+ CC0), **Art Institute of Chicago (AIC)** (3840px 4K IIIF), **The Met** (4K historical Rajput/Mughal architecture), **V&A Museum** (2048px IIIF), and **NASA Earth Imagery** (Ultra-HD natural geography).
     4. **Tier 4 (Secondary Stock)**: **Pixabay API** (`largeImageURL` or `fullHDURL`, min 1600×900).
   - Strictly banned: Pixabay `/get/g…` session links (return HTTP 429), placeholder domains (`picsum.photos`, `via.placeholder`, `placeholder.com`, `dummyimage.com`), low-res thumbnails (< 1000px width), SVG/PDF/maps/diagrams.
   - Sanitize all metadata: Ensure HTML entities (`&lt;`, `&gt;`, `&quot;`, `&amp;`) are completely decoded and any HTML tags (`<a href=...>`, `<b>`, etc.) are 100% stripped from `alt`, `title`, and `caption`.

5. **Rule 5 — Subject Selection (Monuments, Scenery & Architecture Only)**
   - **Target Subjects**: Must feature authentic monuments, scenic landscapes, panoramic views, historical architecture, heritage structures, nature, temples, forts, waterfalls, or beaches.
   - **Automatic Rejections** (Banned Pattern Filter — applied to both title AND URL):
     - ❌ People / portraits / selfies / faces / posing women/girls/boys/men
     - ❌ Vehicles: tractor, bus, train, car, speedboat, turbine
     - ❌ Foreign locations: China, Spain, Brazil, Bali, Indonesia, Malaysia, Ukraine, Berlin, Germany, Vietnam, Cuba, Kyiv
     - ❌ Real-estate/commercial: villas, apartments, "for sale", hotel lobby
     - ❌ Generic stock: random DSC filenames, placeholder images, audio files, diagrams, flags, clip art
     - ❌ Wrong region: verify state/district context matches destination slug

## Search Strategy & Heuristics

When searching for images for a place `<PlaceName>` in destination `<DestinationTitle>`, `<State>`:
1. Try specific query: `"<PlaceName>" "<State>"` or `"<PlaceName>"` on Pexels & Openverse.
2. If fewer than 3 results, try: `"<PlaceName>" temple / fort / waterfall / sanctuary / architecture / landscape`.
3. If still needed, search regional landscape/monument attractions in the same taluk/district/state across Pexels / Openverse.
4. Fall back to high-resolution category-matched authentic Indian landscape/architecture photos.
5. Filter out icons, maps, SVG files, diagrams, flags, or low-res thumbnails (< 800px width).
6. Automatically verify that selected images showcase scenery/architecture rather than people or unrelated stock subjects.
7. After sourcing, run `node scripts/verify_batch2.js` to confirm zero cross-destination URL collisions.

## Automated Tools (Phase 38)

| Script | Purpose |
|--------|---------|
| `scripts/solve_all_batch2_zero_collisions.js` | Multi-page API fetcher: replaces bad/random images with zero-collision verified HD URLs across a target slug list |
| `scripts/verify_batch2.js` | Strict 66k-URL repo-wide collision audit for 10 Batch 2 destinations |
| `scripts/audit_batch2_issues.js` | Pre-audit: flags portrait/foreign/low-quality/banned-pattern images |
| `scripts/fix_cross_batch2_dups.js` | Resolves cross-destination URL collisions between batch targets |
| `scripts/purge_and_fix_all_random_images.js` | Universal random-image purge engine (configurable slug list, full BANNED_PATTERNS filtering) |
