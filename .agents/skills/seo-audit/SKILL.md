---
name: seo-audit
description: "Technical SEO, Search Indexing, and Structured Data Audit skill for ExploreDesh. Audits all 6 XML sitemaps (master sitemap.xml, main, states, destinations 1-3), 2,450 sitemapped URLs, 11,850+ images, robots.txt directives, canonical tag integrity, OpenGraph/Twitter cards, single <h1> hierarchies, meta descriptions, and JSON-LD structured data (Organization, WebSite Sitelinks Searchbox, CollectionPage, TouristDestination, BreadcrumbList, FAQPage). Run whenever checking search engine readiness or modifying routing/metadata."
---

# Technical SEO & Indexing Audit Skill (`/seo-audit`)

This skill audits ExploreDesh's technical SEO architecture, XML sitemaps, indexing directives, and Google Search structured data schemas.

## When to Run This Skill

- Before deploying updates to production.
- After adding or modifying destinations, routes, or slugs.
- After updating sitemaps (`scripts/build-sitemap.js`) or redirect stubs (`scripts/build-stubs.js`).
- When checking meta tags, social sharing cards (OpenGraph), or canonical URLs.

---

## Automated Execution Command

Run the technical SEO audit script from the repository root:

```bash
node scripts/seo_audit.js
```

Target benchmark: **ZERO ERRORS FOUND! All critical technical SEO and indexing checks passed.**

---

## 6 Key Audit Dimensions

### 1. XML Sitemaps Architecture
The platform utilizes a sitemap index hierarchy with 5 sub-sitemaps:
- `sitemap.xml`: Master `<sitemapindex>` pointing to all child sitemaps.
- `sitemap-main.xml`: 5 core platform landing pages.
- `sitemap-states.xml`: 52 regional and state filter URLs.
- `sitemap-destinations-1.xml`: First 1,000 destination pages with `<image:image>` tags.
- `sitemap-destinations-2.xml`: Second 1,000 destination pages with `<image:image>` tags.
- `sitemap-destinations-3.xml`: Remaining destination pages (~393) with images.
- **Verification**: Every XML file must start with valid `<?xml version="1.0" encoding="UTF-8"?>`, declare proper XML namespaces, and contain 0 broken links.

### 2. Robots.txt Directives
- **Master Sitemap Reference**: Must declare `Sitemap: https://exploredesh.com/sitemap.xml`.
- **Duplicate Protection**: Must disallow redirect fallbacks: `Disallow: /stubs/` to prevent search engines from indexing pre-rendered stub duplicates.

### 3. Canonical Tag Verification
- **Static Pages**: Every HTML file must include an absolute canonical tag:
  - `index.html` → `https://exploredesh.com/`
  - `destinations.html` → `https://exploredesh.com/destinations.html`
  - `about.html` → `https://exploredesh.com/about.html`
  - `contact.html` → `https://exploredesh.com/contact.html`
  - `ai-finder.html` → `https://exploredesh.com/ai-finder.html`
  - `privacy.html` → `https://exploredesh.com/privacy.html`
  - `terms.html` → `https://exploredesh.com/terms.html`
- **Dynamic Destination Pages**: In `destination.html`, the generic root canonical must NOT exist statically. A dynamic JavaScript injector must set the self-referencing canonical URL:
  `https://exploredesh.com/destination.html?slug=<cleanSlug>`
  If accessed without a slug, it must apply `<meta name="robots" content="noindex, follow">`.

### 4. Heading Hierarchy & Meta Tags
- **Single `<h1>` Rule**: Every page must have exactly one semantic `<h1>` element.
- **Title Tags**: Concise and descriptive (under 65 characters) formatted as `Title — ExploreDesh | Tagline`.
- **Meta Descriptions**: Between 80 and 160 characters describing the specific page contents.
- **OpenGraph & Twitter Cards**: `og:title`, `og:description`, `og:image`, `og:url`, `og:type="website"`, and `twitter:card="summary_large_image"`.

### 5. Structured Data (JSON-LD)
ExploreDesh implements rich Schema.org structured data schemas:
- **Organization & WebSite**: Declared on `index.html` with Sitelinks Searchbox integration (`potentialAction`).
- **CollectionPage**: Declared on `destinations.html` for catalogue discovery.
- **TouristDestination**: Dynamically injected on `destination.html` by `js/pages/destination.js` via `seo.js`.
- **BreadcrumbList**: Structured breadcrumbs linking `Home > Destinations > [Destination Title]`.
- **FAQPage**: Structured FAQ accordion schema on destination guides for Google rich snippets.

### 6. Pre-rendered Stubs & Redirects
- **Stubs Verification**: All 2,393 destinations must have pre-rendered fallback stubs in `stubs/<slug>.html`.
- **Redirect Architecture**: Stubs must contain instant client-side redirection (`window.location.replace`) to `/destination.html?slug=<slug>` and declare absolute canonical tags.

---

## Remediation Commands

If any SEO check fails, run the builder tools to regenerate fresh sitemaps and stubs:

```bash
# Rebuild all 6 XML sitemaps
node scripts/build-sitemap.js

# Rebuild all 2,393 pre-rendered redirect stubs
node scripts/build-stubs.js

# Re-run the SEO audit to verify
node scripts/seo_audit.js
```
