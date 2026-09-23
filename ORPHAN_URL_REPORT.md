# ExploreDesh — Orphan URL & Crawl Graph Audit Report

> **Audited**: 2026-09-23  
> **Platform**: [https://exploredesh.com](https://exploredesh.com)  
> **Repository Dataset**: 2,393 Destinations, 36 States & UTs, 8 Core Templates, 6 Sitemaps (2,450 URLs).

---

## Executive Summary: Zero Orphan Destinations Detected

Across the entire ExploreDesh repository and sitemap catalog:
- **Destinations in Database (`data/destinations/index.json`)**: 2,393
- **Destination JSON Files (`data/destinations/<slug>.json`)**: 2,393 (100% parity)
- **Destination URLs in XML Sitemaps (`sitemap-destinations-1..3.xml`)**: 2,393 (100% parity)
- **Pre-rendered Redirect Stubs (`stubs/<slug>.html`)**: 2,393 (100% parity)
- **Data-only URLs (In database but missing from sitemaps)**: **0**
- **Sitemap-only URLs (In sitemaps but missing from database)**: **0**
- **Completely Orphan URLs**: **0**

---

## 1. Tripartite URL Parity Matrix

The technical crawl discovery engine analyzed the intersection of:
1. **Application Data Layer** (`data/destinations/index.json` + `data/destinations/*.json`)
2. **Search Engine Sitemaps** (`sitemap.xml`, `sitemap-main.xml`, `sitemap-states.xml`, `sitemap-destinations-1..3.xml`)
3. **Internal HTML & DOM Link Graphs** (Header navigation, breadcrumbs, category hubs, state filter landings, similar destination rails, and catalogue grids)

| Dataset | URL Count | Parity Status | Discrepancies |
|---|---|---|---|
| Core Static Templates | 5 | 100% Mapped in `sitemap-main.xml` | None |
| State Landings (`?state=`) | 32 (States with ≥3 destinations) | 100% Mapped in `sitemap-states.xml` | None |
| Category Landings (`?type=`) | 8 | 100% Mapped in `sitemap-states.xml` | None |
| Monthly Guides (`?month=`) | 12 | 100% Mapped in `sitemap-states.xml` | None |
| Destination Detail Guides (`?slug=`) | 2,393 | 100% Mapped across chunked sitemaps | None |
| **Total Indexable Catalog** | **2,450** | **100% Sitemapped & Linked** | **0 Errors** |

---

## 2. Crawl Discovery Pathways

Googlebot and other web crawlers discover pages through two parallel, mutually reinforcing architectures:

```
[Googlebot Discovery]
         │
         ├────────────────────────────────────────┬────────────────────────────────────────┐
         │                                        │                                        │
         ▼                                        ▼                                        ▼
[XML Sitemaps Index]                     [Homepage / Navigation]                  [State & Hub Landings]
https://exploredesh.com/sitemap.xml      https://exploredesh.com/                 destinations.html?state=Goa
         │                                        │                                        │
         ├─ sitemap-main.xml (5)                  ├─ Main Nav (Home, Dests, AI, About)     ├─ State Destination Cards
         ├─ sitemap-states.xml (52)               ├─ Category Pills (8 Types)              │   (<a href="destination.html?slug=...">)
         ├─ sitemap-destinations-1.xml (1000)     ├─ Trending Carousel Cards               │
         ├─ sitemap-destinations-2.xml (1000)     ├─ Monthly Highlights Grid               │
         └─ sitemap-destinations-3.xml (393)      └─ Interactive India Map                 │
         │                                        │                                        │
         └────────────────────────────────────────┴────────────────────────────────────────┘
                                                  │
                                                  ▼
                                    [Destination Guide Page]
                              destination.html?slug=manali
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        │                                                   │
                        ▼                                                   ▼
               [Breadcrumb Anchors]                             [Similar Destinations Rail]
             Home > Destinations > Himachal                     4 Contextual Internal Links
```

### Crawl Path Guarantee:
1. **Tier 1 (Root Discovery)**: Every destination is reachable via XML sitemaps within 1 hop from `sitemap.xml`.
2. **Tier 2 (Hierarchical Discovery)**:
   - `index.html` → `destinations.html?state=<state>` → `destination.html?slug=<slug>`.
   - Maximum link depth from root: **2 clicks / hops**.
3. **Tier 3 (Horizontal Discovery)**:
   - Every destination guide renders a "Similar Destinations" rail (`similar-grid`) populated by `js/pages/destination.js` (`populateSimilar()`), distributing PageRank horizontally between related destinations.
   - Every destination guide renders breadcrumbs (`Home` > `Destinations` > `[State]`), linking upward back to the category and state hubs.

---

## 3. Discovered URL Classification & Audit Table

| URL | Page Type | Current Status | Discovery Channel | Recommended Action |
|---|---|---|---|---|
| `https://exploredesh.com/` | Homepage | 200 OK, Canonical | Main Nav, Sitemap, External | Preserve |
| `https://exploredesh.com/destinations.html` | Catalogue | 200 OK, Canonical | Main Nav, Sitemap, Footer | Preserve |
| `https://exploredesh.com/destinations.html?state=<State>` | State Landing | 200 OK, Dynamic Canonical | `sitemap-states.xml`, India Map | Preserve |
| `https://exploredesh.com/destinations.html?type=<Type>` | Category Landing | 200 OK, Dynamic Canonical | `sitemap-states.xml`, Category Strip | Preserve |
| `https://exploredesh.com/destinations.html?month=<1-12>` | Monthly Guide | 200 OK, Dynamic Canonical | `sitemap-states.xml`, Monthly Rail | Preserve |
| `https://exploredesh.com/destination.html?slug=<slug>` | Destination Guide | 200 OK, Dynamic Self-Canonical | Sitemaps 1-3, Cards, Breadcrumbs | Preserve |
| `https://exploredesh.com/ai-finder.html` | AI Trip Finder | 200 OK, Canonical | Main Nav, Hero Card, Sitemap | Preserve |
| `https://exploredesh.com/about.html` | Company About | 200 OK, Canonical | Main Nav, Footer, Sitemap | Preserve |
| `https://exploredesh.com/contact.html` | Contact Form | 200 OK, Canonical | Main Nav, Footer, Sitemap | Preserve |
| `https://exploredesh.com/privacy.html` | Utility (Privacy) | 200 OK, `noindex, follow` | Footer | Retain `noindex` (Crawl budget protection) |
| `https://exploredesh.com/terms.html` | Utility (Terms) | 200 OK, `noindex, follow` | Footer | Retain `noindex` (Crawl budget protection) |
| `https://exploredesh.com/stubs/<slug>.html` | Redirect Stub | 200 OK, `noindex, follow` | Direct legacy visits | Blocked in `robots.txt` & `_headers` (Correct) |
| `https://exploredesh.com/404.html` | Error Page | 404 Not Found, `noindex` | Fallback on unhandled paths | Retain `noindex` (Correct) |

---

## 4. Verification Methodology

The orphan audit was verified programmatically via `scripts/audit/master_seo_audit.js`:
- Verified all 2,393 slugs from `data/destinations/index.json` exist in the XML sitemaps (`sitemap-destinations-1/2/3.xml`).
- Verified all 2,393 slugs from the XML sitemaps exist in `data/destinations/`.
- Verified all 2,393 pre-rendered redirect stubs in `stubs/*.html` match catalog slugs.
- Verified 0 broken relative internal links across all HTML templates via `scripts/audit/check_broken_links.js`.
