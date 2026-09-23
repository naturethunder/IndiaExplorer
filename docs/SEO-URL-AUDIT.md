# ExploreDesh — Master URL Architecture & Indexation Inventory

> **Document Type:** Comprehensive URL & Routing Strategy Audit  
> **Platform:** [ExploreDesh.com](https://exploredesh.com)  
> **Standard:** [seo.md](file:///d:/latest%20live/ExploreDesh/seo.md) — Section 8, Section 11 & Section 50  
> **Total Sitemapped URLs:** 2,450  
> **Status:** Audited, Classified & Enforced

---

## 1. Executive Summary

A successful programmatic SEO architecture requires clear demarcation between **indexable canonical landing pages** and **utility, search, or parameterized query paths**.

Accidental indexation of multi-faceted filter combinations generates millions of thin duplicate pages that deplete crawl budget and harm domain trust.

This document classifies every discovered URL pattern on ExploreDesh into one of five indexation directives:
1. **INDEX:** High-value canonical URLs submitted to sitemaps and crawled by Google.
2. **NOINDEX:** Utility, search, or filtered views accessible to users but excluded from search indices.
3. **CANONICALIZE:** URLs with alternate parameters pointing back to primary canonical parent.
4. **REDIRECT:** Deprecated or legacy URLs permanently forwarded via 301.
5. **DISALLOW (ROBOTS):** Crawl-blocked paths to protect crawl budget.

---

## 2. Complete URL Classification Table

| URL Pattern / Route | Page Type | HTTP Status | Target Indexation Directive | Robots Directive | Sitemapped | Canonical Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `https://exploredesh.com/` | Homepage Hub | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/` |
| `https://exploredesh.com/destinations.html` | Master Catalogue | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/destinations.html` |
| `https://exploredesh.com/about.html` | About & Authority | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/about.html` |
| `https://exploredesh.com/contact.html` | Contact & Inquiries | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/contact.html` |
| `https://exploredesh.com/ai-finder.html` | AI Trip Finder | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/ai-finder.html` |
| `https://exploredesh.com/privacy.html` | Legal & Privacy | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/privacy.html` |
| `https://exploredesh.com/terms.html` | Legal & Terms | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-main.xml`) | `https://exploredesh.com/terms.html` |
| `https://exploredesh.com/destination.html?slug=<slug>` | Destination Guide (2,393 items) | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-destinations-*.xml`) | Self-referencing `?slug=<slug>` |
| `https://exploredesh.com/destinations.html?state=<State>` | State Hub (36 States/UTs >= 3 items) | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-states.xml`) | Self-referencing `?state=<State>` |
| `https://exploredesh.com/destinations.html?type=<category>` | Category Landings (14 items) | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-states.xml`) | Self-referencing `?type=<category>` |
| `https://exploredesh.com/destinations.html?month=<1-12>` | Monthly Travel Guides (12 items) | 200 OK | **INDEX** | `index, follow` | Yes (`sitemap-states.xml`) | Self-referencing `?month=<1-12>` |
| `https://exploredesh.com/stubs/<slug>.html` | Static Pre-rendered Fallback (2,393 items) | 200 OK | **DISALLOW / NOINDEX** | `noindex, follow` (via header) + Disallow in `robots.txt` | No | `https://exploredesh.com/destination.html?slug=<slug>` |
| `https://exploredesh.com/destinations.html?search=<query>` | Internal Site Search | 200 OK | **NOINDEX / CANONICALIZE** | `noindex, follow` | No | `https://exploredesh.com/destinations.html` |
| `https://exploredesh.com/destinations.html?tier=<tier>&state=...` | Multi-Faceted Combinations | 200 OK | **NOINDEX / CANONICALIZE** | `noindex, follow` | No | `https://exploredesh.com/destinations.html` |
| `https://exploredesh.com/data/destinations/<slug>.json` | Raw JSON Endpoints | 200 OK | **NOINDEX** | `X-Robots-Tag: noindex, nofollow` | No | None (API asset) |

---

## 3. URL Quality & Formatting Invariants

1. **Protocol & Host:** Strictly HTTPS with apex domain (`https://exploredesh.com`).
2. **Case Sensitivity:** All slug parameters are strictly lowercased (`?slug=manali`, not `?slug=Manali`).
3. **Trailing Slashes:** Standardized without trailing slash on HTML endpoints (`/destinations.html`, not `/destinations.html/`).
4. **Special Character Encoding:** Spaces in query parameters are standard URL encoded (`%20` or `+`) while slugs use clean hyphens (`-`).
5. **No Redirect Chains:** Every stub redirects directly in 1 step to the destination URL.
