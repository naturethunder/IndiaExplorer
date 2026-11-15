---
name: audit-all
description: "Master Unified Audit Suite for ExploreDesh. Runs all 4 production audit pillars sequentially: (1) UI/UX Pro Max QA & Accessibility Audit across all 10 HTML templates and 5 CSS files, (2) Technical SEO, Indexing & Sitemaps Audit across 6 sitemaps, 2,457 URLs, and schema data, (3) Media & Destination Integrity Audit across all 2,396 destinations and 67,900+ photo URLs, and (4) Client-Side Security & OWASP Vulnerability Audit across headers, CSP, DOM-XSS, secrets, and reverse tabnabbing. Produces an executive platform health scorecard. Use whenever performing full-system quality certification."
---

# Master Unified Audit Suite (`/audit-all`)

This master skill orchestrates all four primary production audit pillars of ExploreDesh in a single execution pass to certify platform readiness.

## When to Run This Skill

- Before production deployments or staging releases.
- After substantial multi-file updates, visual redesigns, catalog changes, or security reviews.
- To produce an executive health report summarizing UI/UX, SEO, Media integrity, and Security posture.

---

## Master Execution Command

Run the unified quad-pillar audit suite from the repository root:

```bash
node scripts/audit_all.js
```

---

## 4 Core Audit Pillars Executed

| Pillar | Sub-Skill | Command | Focus Area |
|---|---|---|---|
| **1. UI/UX & A11y** | [`/ui-ux-qa-audit`](../ui-ux-qa-audit/SKILL.md) | `node scripts/ui_ux_qa_audit.js` | 7 categories: WCAG AAA contrast, responsive layout (390/768/1440px), touch targets, roving tabindex, Light & Dark mode consistency |
| **2. Technical SEO** | [`/seo-audit`](../seo-audit/SKILL.md) | `node scripts/seo_audit.js` | Sitemaps (6 XML files, 2,457 URLs, 11,980 images), robots.txt, canonical links, OpenGraph, JSON-LD structured schemas |
| **3. Media Integrity** | [`/media-integrity-audit`](../media-integrity-audit/SKILL.md) | `node scripts/final-repository-audit.js` | 2,396 destinations: 5 HD gallery images, hero parity, 3 place photos, zero duplicate URLs, 100% Indian geographic authenticity (zero foreign stock), zero Pixabay session URLs |
| **4. Security & OWASP** | Security Audit Suite | `node scripts/security_audit.js` | 8 security vectors: Clickjacking, CSP, DOM-XSS sanitization, reverse tabnabbing (rel=noopener), open redirects, secret leakage, mixed content, form botcheck |

---

## How to Run Individual Audits

If you only need to run or diagnose a specific area, you can invoke each skill directly:

- **UI/UX & Design QA**: Type `/ui-ux-qa-audit` or `node scripts/ui_ux_qa_audit.js`
- **Technical SEO & Indexing**: Type `/seo-audit` or `node scripts/seo_audit.js`
- **Media & Photos**: Type `/media-integrity-audit` or `node scripts/final-repository-audit.js`
- **Security & Vulnerabilities**: `node scripts/security_audit.js`
- **Full Platform Quad-Audit**: Type `/audit-all` or `node scripts/audit_all.js`
