---
name: audit-all
description: "Master Unified Audit Suite for ExploreDesh. Runs all 3 production audit pillars sequentially: (1) UI/UX Pro Max QA & Accessibility Audit across all 8 HTML templates and 4 CSS files, (2) Technical SEO, Indexing & Sitemaps Audit across 6 sitemaps, 2,450 URLs, and schema data, and (3) Media & Destination Integrity Audit across all 2,393 destinations and 66,000+ photo URLs. Produces an executive platform health scorecard. Use whenever performing full-system quality certification."
---

# Master Unified Audit Suite (`/audit-all`)

This master skill orchestrates all three primary production audit pillars of ExploreDesh in a single execution pass to certify platform readiness.

## When to Run This Skill

- Before production deployments or staging releases.
- After substantial multi-file updates, visual redesigns, or catalog changes.
- To produce an executive health report summarizing UI/UX, SEO, and Media integrity.

---

## Master Execution Command

Run the unified audit suite from the repository root:

```bash
node scripts/audit_all.js
```

---

## 3 Core Audit Pillars Executed

| Pillar | Sub-Skill | Command | Focus Area |
|---|---|---|---|
| **1. UI/UX & A11y** | [`/ui-ux-qa-audit`](../ui-ux-qa-audit/SKILL.md) | `node scripts/ui_ux_qa_audit.js` | 7 categories: WCAG AAA contrast, responsive layout (390/768/1440px), touch targets, roving tabindex, Light & Dark mode consistency |
| **2. Technical SEO** | [`/seo-audit`](../seo-audit/SKILL.md) | `node scripts/seo_audit.js` | Sitemaps (6 XML files, 2,450 URLs, 11,853 images), robots.txt, canonical links, OpenGraph, JSON-LD structured schemas |
| **3. Media Integrity & Photographic Truth** | [`/media-integrity-audit`](../media-integrity-audit/SKILL.md) | `node scripts/final-repository-audit.js` | 2,393 destinations: Rule 0 photographic truth (0 cross-monument borrowing per `.agents/rules/destination-strict-rules.md`), 5 HD gallery images, hero parity, 3 place photos, zero duplicate URLs, 100% Indian geographic authenticity, zero rate limits |

---

## How to Run Individual Audits

If you only need to run or diagnose a specific area, you can invoke each skill directly:

- **UI/UX & Design QA**: Type `/ui-ux-qa-audit`
- **Technical SEO & Indexing**: Type `/seo-audit`
- **Media & Photos**: Type `/media-integrity-audit`
- **Full Platform Verification**: Type `/audit-all`
