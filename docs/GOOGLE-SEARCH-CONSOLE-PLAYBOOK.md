# ExploreDesh — Google Search Console Operations Playbook

> **Document Type:** Production Operating Manual & Triage Playbook  
> **Platform:** [ExploreDesh.com](https://exploredesh.com)  
> **Status:** Live Verified in Google Search Console on **Sep 23, 2026**  
> **Standard:** [seo.md](file:///d:/latest%20live/ExploreDesh/seo.md) — Section 44, Section 45 & Section 50  
> **Audience:** SEO Engineers, Product Managers, Content Strategists

---

## 1. Live Google Search Console Status (Audited Sep 23, 2026)

| GSC Section | Metric / Status | Details |
|---|---|---|
| **Submitted Sitemap** | `https://exploredesh.com/sitemap.xml` | Master Sitemap Index (pointing to 5 child sitemaps) |
| **Sitemap Status** | **Success** (Last read: Sep 23, 2026) | **2,450 discovered pages**, 0 errors |
| **Indexed Pages** | **2 pages** | `https://exploredesh.com/` (Home) and `https://exploredesh.com/destinations.html` (Catalogue) |
| **Discovered - not indexed** | **2,447 pages** | Status: **Validation: Started**. Standard Google crawl queue allocation for new large catalogs |
| **Alternate with canonical** | **1 page** | `https://exploredesh.com/destinations` (properly canonicalized to `/destinations.html`) |
| **Redirect error** | **1 page** | `https://exploredesh.com/about.html` (Logged Sep 18; verified live as 200 OK; Validation: Started) |

---

## 2. Property Setup & Verification Invariants

1. **Domain Property Verification:**
   - Primary Verification: DNS TXT Record on root domain DNS via Cloudflare.
   - Secondary Verification: HTML verification meta tag in `<head>` of `index.html`:
     ```html
     <meta name="google-site-verification" content="HqAoAKbe2yBCMPODIFdVDp2x07-FP8hOMRsaaLjtokc" />
     ```
2. **Sitemap Index Submission:**
   - In Google Search Console under **Indexing > Sitemaps**, submit the master sitemap index:
     `https://exploredesh.com/sitemap.xml`
   - GSC automatically discovers and processes all 5 child sitemaps:
     - `sitemap-main.xml` (5 core URLs)
     - `sitemap-states.xml` (52 state, category & monthly landing URLs)
     - `sitemap-destinations-1.xml` (1,000 URLs + 4,991 images)
     - `sitemap-destinations-2.xml` (1,000 URLs + 4,983 images)
     - `sitemap-destinations-3.xml` (393 URLs + 1,961 images)
   - Total catalog size: **2,450 URLs** and **11,935 images**.

---

## 3. GSC Diagnostic Decision Framework

When analyzing Search Console performance and coverage reports, apply this deterministic troubleshooting rubric:

| GSC Metric Pattern | Primary Root Cause | Engineering Remediation Protocol |
| :--- | :--- | :--- |
| **"Discovered - currently not indexed"** | Normal crawl budget queuing for large catalogs. | 1. **DO NOT manually request indexing for thousands of URLs** (Google limits inspection requests to ~10–12/day).<br>2. Rely on the XML Sitemap Index with stable, content-derived `<lastmod>` timestamps.<br>3. Verify destination pages are linked internally via state hubs and similar destination rails.<br>4. Allow Googlebot to crawl queued batches over several weeks. |
| **"Crawled - currently not indexed"** | Googlebot rendered the page but judged content thin or near-duplicate. | 1. Inspect rendered HTML via Search Console live test.<br>2. Verify JSON payload loaded properly without timeouts.<br>3. Check if destination is one of the 26 with brief summaries; expand unique historical/travel context without fabricating data. |
| **"Alternate page with proper canonical tag"** | Expected behavior when alternate URL variations (e.g. `/destinations` without `.html`) are visited. | 1. Verify self-referencing canonical on preferred URL.<br>2. Ensure internal links consistently point to the canonical URL (`destinations.html`).<br>3. No remediation needed if canonical URL is correctly indexed. |
| **"Redirect error"** | Temporary edge routing or deployment timeout. | 1. Test live URL HTTP status code (must return 200 OK without redirect chains).<br>2. In GSC, click **"Validate Fix"** to prompt Googlebot re-verification. |
| **High Impressions + Low CTR (<2%)** | SERP snippet lacks enticing travel hooks. | 1. Inspect SERP snippet rendering in URL Inspection tool.<br>2. Ensure `<title>` frontloads destination name and primary hook.<br>3. Verify meta description mentions top attractions, best season, and price tiers. |
| **High Impressions + Position 8–20 (Page 2 Trap)** | Page has high topical authority but lacks deep content signals to break into top 3. | 1. Add 2–3 contextual in-content internal links from relevant high-traffic state hubs.<br>2. Expand attraction depth in `topPlaces` with historical facts or visitor tips.<br>3. Add structured FAQ accordions (`FAQPage` schema). |

---

## 4. Priority URL Inspection Strategy (Sample Only)

Never exhaust daily inspection quotas on random pages. Only inspect this curated representative set when verifying deployment changes:
1. `https://exploredesh.com/` (Homepage)
2. `https://exploredesh.com/destinations.html` (Catalogue)
3. `https://exploredesh.com/destinations.html?state=Goa` (State Landing Hub)
4. `https://exploredesh.com/destination.html?slug=manali` (High-traffic Destination)
5. `https://exploredesh.com/destination.html?slug=varanasi` (Heritage Destination)
6. `https://exploredesh.com/ai-finder.html` (AI Trip Finder)

---

## 5. Core Web Vitals (CWV) Triage in GSC

ExploreDesh monitors the GSC **Experience > Core Web Vitals** report:
- **LCP (Largest Contentful Paint) > 2.5s:**
  - Verify hero image CDN delivers optimized WebP/JPEG under 150KB.
  - Check `<link rel="preload" as="image" fetchpriority="high">` remains active in HTML head.
- **CLS (Cumulative Layout Shift) > 0.1:**
  - Verify all images have explicit CSS dimensions or `aspect-ratio` wrappers.
  - Verify fonts use `font-display: swap`.
- **INP (Interaction to Next Paint) > 200ms:**
  - Avoid heavy CPU tasks on main thread during user clicks.
  - Debounce search input handlers (minimum 150ms).

---

## 6. Structured Data Rich Results Monitoring

Check GSC **Enhancements** tab weekly:
- **Breadcrumbs:** Must report 0 errors across 2,450 URLs.
- **Sitelinks Searchbox:** Must show valid integration with `potentialAction` (`destinations.html?search={search_term_string}`).
- **TouristDestinations & Rich Media:** Check for zero schema warnings or unparseable JSON-LD blocks.
