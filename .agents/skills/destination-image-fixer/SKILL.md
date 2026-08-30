---
name: destination-image-fixer
description: "Autonomous agent skill for auditing, retrieving, and repairing destination hero images, gallery images, and place images across IndiaExplorer destination JSON files. Enforces 5 HD unique hero/gallery images, 3 unique place photos per place, and 0 duplicate URLs across the entire file."
---

# Destination Image Fixer — Agent Skill

This skill defines the autonomous image acquisition and quality enforcement workflow for ExploreDesh destination dataset.

## Core Rules

1. **Rule 1 — Hero & Gallery (5 Unique HD Images)**
   - Exactly 5 unique HD image URLs in `gallery[]` array.
   - Primary `heroImage.src` must match `gallery[0].src` or be a valid HD image.
   - Minimum resolution width 1280px or Wikimedia original full-resolution.
   - Every gallery item must have descriptive `alt` text.

2. **Rule 2 — Nearby Places (Flexible Count, 3 Photos per Existing Place)**
   - The number of places in `topPlaces[]` is **non-mandatory / flexible** (can be 1, 2, 3, 4, 5, 6, 7, 8, etc.).
   - **Preserve existing places**: Do NOT force-add or auto-generate dummy places to hit an artificial number. Keep whatever valid places already exist.
   - For every place that exists:
     - 1 unique `image.src` (card thumbnail).
     - Exactly 3 unique image URLs in `photos[]`.
     - Photos must accurately reflect the specific place.
     - Descriptive `alt` text.

3. **Rule 3 — Zero Duplicate URLs**
   - No image URL may be reused across distinct items in the same destination JSON.
   - Disjoint sets for gallery vs place cards vs place photos.

4. **Rule 4 — Authentic Legal Sourcing**
   - Source images strictly from **Wikimedia Commons**, **Pexels**, **Unsplash**, **Pixabay**, **Google Places Photos**, **Openverse**, or **Mapillary**.
   - No placeholder domains (`picsum.photos`, `via.placeholder`, `placeholder.com`).
   - Use high-resolution original URLs (`imageinfo/url` on Wikimedia Commons, `largeImageURL` on Pixabay, HD query parameters on Pexels/Unsplash).

5. **Rule 5 — Subject Selection (Monuments, Scenery & Architecture Only)**
   - **Target Subjects**: Must feature authentic monuments, scenic landscapes, panoramic views, historical architecture, heritage structures, nature, temples, forts, waterfalls, or beaches.
   - **Automatic Rejections**: Strictly discard images containing prominent individuals/portraits/selfies, tourist poses blocking landmarks, unrelated/mismatched locations, indoor office spaces, food close-ups, or irrelevant items.

## Search Strategy & Heuristics

When searching for images for a place `<PlaceName>` in destination `<DestinationTitle>`, `<State>`:
1. Try specific query: `"<PlaceName>" "<State>"` or `"<PlaceName>"` on Wikimedia Commons & Google Places.
2. If fewer than 3 results, try: `"<PlaceName>" temple / fort / waterfall / sanctuary / architecture / landscape` on Pixabay, Pexels, Unsplash, or Openverse.
3. If still needed, search regional landscape/monument attractions in the same taluk/district/state across Pixabay / Wikimedia / Openverse.
4. Fall back to high-resolution category-matched authentic Indian landscape/architecture photos.
5. Filter out icons, maps, SVG files, diagrams, flags, or low-res thumbnails (< 800px width).
6. Automatically verify that selected images showcase scenery/architecture rather than people or unrelated stock subjects.


