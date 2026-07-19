---
description: Full professional QA + audit of the site (functional, UI, UX, a11y, SEO, perf, security) — finds and fixes issues, then reports
---

# 🔍 Full Professional QA & Audit — IndiaExplore

You are a **senior engineer** (QA + frontend + full-stack + UI/UX + accessibility + SEO +
performance + security). Use the **Ponytail** (minimal-diff, code-first) and **UI/UX Pro** skills,
and dispatch **parallel sub-agents** for the audit (functional/JS · a11y+SEO · perf+CSS) whose
findings you verify before acting.

**First, orient:** read `CLAUDE.md` (architecture/constraints), `docs/AUDIT.md` (last audit state),
and `docs/ROADMAP.md` (plan). Don't re-report already-fixed items unless they regressed.

## Primary objective
A complete professional audit of the website. **Check everything. Find every issue. Fix it.**

## Check everything (17 categories)
1. **Functional** — every button, link, card, image, nav item, search, filter, gallery, modal
   actually works; no dead handlers, no broken IDs, no 404s, no console errors.
2. **UI** — alignment, spacing, typography scale, color usage, hover/active/focus/disabled states.
3. **UX** — navigation clarity, visual hierarchy, CTA placement, mobile flow, touch targets,
   empty states, error states, loading states.
4. **Header / navbar** — links, logo, active states, mobile menu, sticky behavior.
5. **Footer** — links, columns, social icons, contrast, legal links.
6. **Destination pages** — hero, tabs, places, stays, route, map, weather, gallery, modal, similar.
7. **Nearby / underrated places** — logic correctness, no duplicates, sensible ranking.
8. **Animations** — smoothness, reduced-motion support, no jank/CLS.
9. **Responsive** — desktop → tablet → mobile → landscape; no overflow, no clipped content.
10. **Accessibility** — ARIA roles, keyboard nav, focus trap/return, focus-visible, alt text,
    color contrast (WCAG 2.1 AA), landmarks, skip links, form labels, aria-live.
11. **SEO** — `<title>`, meta description, canonical, OpenGraph, Twitter, structured data
    (JSON-LD), sitemap.xml, robots.txt, heading order.
12. **Performance** — image sizing/lazy-load/fetchpriority, CLS/LCP/INP, render-blocking JS/CSS,
    gzip, unused CSS/JS, cache headers.
13. **Code quality** — dead code, duplication, guards, escaping, naming, consistency.
14. **Security** — `target="_blank"` → `rel="noopener"`, input validation, honeypot, no XSS,
    no secrets leaked, no console errors.
15. **Browser compatibility** — modern evergreen + Safari/iOS quirks (safe-area, 100vh).
16. **Visual consistency** — design-system adherence across all pages.
17. **Travel-website best practices** — trust signals, honest counts, clear pricing, discovery.

## Fix policy — IMPORTANT
- **Do NOT ask for permission. Identify issues. Fix them immediately.**
- Maintain **backward compatibility**. Do **not** introduce breaking changes.
- **Preserve all existing functionality.**

## Change policy
- Minimal, production-safe, surgical. **Don't rewrite working code.** Shortest correct diff.
- Respect the hard constraints in `CLAUDE.md`: vanilla JS/ES6 modules only, **no framework, no
  npm deps, no bundler, no `file://` assumptions, no hardcoded content** (data lives in `data/`).
- After using a **new Tailwind utility class**, re-run `node scripts/build-css.js`.
- After **destination-content** changes: `node scripts/build-json-data.js` → `build-stubs.js` →
  `build-destinations-doc.js`.

## Verify (no browser automation available)
- `node --check <file>.js` for every JS module touched.
- Smoke-test served routes with the dev server:
  ```bash
  node scripts/serve.js 8123 &
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/index.html
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/destination.html?slug=goa
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8123/data/destinations/goa.json
  ```
- Use **`curl`** (not Node `fetch`) for any external-endpoint check — the corporate proxy.

## Deliverable — final report
When done, output:

### ## Executive Summary
Quality score **0–100** + production-readiness verdict, plus per-dimension scores:
**UI / UX / Accessibility / SEO / Performance / Code quality / Security / Mobile**.

### ## Detailed Findings
For each issue: **what · why it matters · severity (Critical/High/Medium/Low) · file · fix applied**.

### ## Final Validation
A checklist confirming routes 200, JS clean, no stale data, a11y/SEO/perf/security checks pass.

## After the audit — update the log
**Refresh `docs/AUDIT.md`** with the new scores, the fixes shipped this pass, and what's still
open, so the next run starts from current truth.

---
**Only finish when the website is ready for production deployment.**
