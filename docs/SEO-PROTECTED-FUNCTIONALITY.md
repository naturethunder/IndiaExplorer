# ExploreDesh — Protected SEO & Platform Functionality Specification

> **Document Type:** Production Architecture Guardrail & Invariant Register  
> **Target System:** [ExploreDesh.com](https://exploredesh.com)  
> **Standard:** [seo.md](file:///d:/latest%20live/ExploreDesh/seo.md) — Section 41  
> **Status:** Active & Enforced

---

## 1. Executive Directive

Under **Rule A (Zero Functionality Removal)** of the Master SEO Engineering System, no optimization, code refactoring, automation script, or search engine improvement may remove, replace, disable, or degrade existing platform features, user-facing utilities, routing pathways, or data stores.

Every architectural modification must be strictly **additive and non-destructive**.

---

## 2. Protected Feature Matrix

| System Component | Core Files / Handlers | Protected Behavior & User Value |
| :--- | :--- | :--- |
| **Interactive India Map** | `js/components/indiaMap.js`, `data/india-map.js`, `index.html` | SVG vector map enabling visual exploration of 36 States & UTs with hover tooltips, click navigation to state catalogue, and responsive zoom. |
| **AI Trip Finder** | `ai-finder.html`, `js/pages/finder.js` | Intelligent multi-criteria trip matching engine (duration, budget, companion type, preferred terrain) providing tailored recommendations. |
| **Search Engine (Universal)** | `js/utils/search.js`, `data/search-index.json`, `index.html`, `destinations.html` | Client-side fast fuzzy search index indexing 2,393 destinations and 14,017 attractions with autocomplete, state matching, and highlight. |
| **Dynamic Filter Engine** | `destinations.html`, `js/pages/explore.js` | Instant multi-faceted filtering across states (36), categories/types (14), price tiers (7), seasons (3), and months (12) without full-page reloads. |
| **Dual Theme System** | `js/utils/theme.js`, `css/styles.css`, `css/glass-immersive.css` | Zero-FOUC (Flash of Unstyled Content) Light Mode & Dark Mode toggle with persistent `localStorage` preference and OS-level matching. |
| **Offline Hub & PWA** | `sw.js`, `manifest.webmanifest`, `js/utils/offlineStorage.js`, `js/components/offlineHub.js` | Progressive Web App offline caching of visited destinations, service worker pre-caching, and offline bookmarking. |
| **Fallback Redirect Stubs** | `stubs/<slug>.html`, `scripts/build-stubs.js` | 2,393 pre-rendered static HTML stubs providing zero-JS client redirects (`window.location.replace`) to canonical dynamic endpoints. |
| **XML Sitemaps Pipeline** | `scripts/build-sitemap.js`, `sitemap*.xml` | Automated Google Image Sitemap index with 5 child sitemaps covering 2,450 clean URLs and 11,935 verified images. |
| **Direct Dynamic Routing** | `destination.html?slug=<slug>`, `destinations.html?state=<state>` | Universal URL routing scheme supporting bookmarks, deep links, and dynamic JSON-LD injection. |

---

## 3. Data Integrity & Content Guardrails

1. **2,393 Destination JSON Dataset (`data/destinations/*.json`)**:
   - Zero destination entities may be deleted or renamed without a corresponding 301 redirect mapping.
   - All destination entities must maintain: `slug`, `title`, `state`, `country: "India"`, `coordinates` (within India geographic boundaries), `weather`, `topPlaces` (minimum 3 places per destination), `hotels`, `howToReach`, `gallery` (5 images), and `seo`.

2. **Zero Fake Review / Rating Policy (Rule C & Rule F)**:
   - Schema generator (`js/components/seo.js`) must never inject fabricated `aggregateRating` (e.g. dummy 4.5 stars / 1200 reviews) unless verified reviews exist in the dataset.
   - Preserves search engine trust and protects against Google Search manual actions.

3. **Media & Image Protection (Rule E)**:
   - Existing valid hero images and place photos must not be mass-replaced without verifiable evidence of broken HTTP status or irrelevance.
   - Cross-destination collisions must be resolved safely without deleting catalog items.

---

## 4. Verification Check Before Code Merges

Before committing any structural or frontend modification, developers and autonomous agents must run:

```bash
# Automated SEO Regression Guard
node scripts/seo_regression_guard.js

# Full UI/UX & SEO Audit Suite
node scripts/audit_all.js
```

All 71+ regression invariants must return `[PASS]` with 0 defects before deployment.
