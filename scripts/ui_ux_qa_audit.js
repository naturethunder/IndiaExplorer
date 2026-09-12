/**
 * scripts/ui_ux_qa_audit.js
 * ============================================================
 * Deep UI/UX QA Audit script powered by ui-ux-pro-max guidelines.
 * Audits HTML, CSS, and JS components against the 10 priority categories.
 */

const fs = require('fs');
const path = require('path');

const HTML_FILES = [
  'index.html',
  'destinations.html',
  'destination.html',
  'ai-finder.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html'
];

const CSS_FILES = [
  'css/styles.css',
  'css/explore-immersive.css',
  'css/destination-immersive.css',
  'css/glass-immersive.css'
];

console.log('================================================================');
console.log('🔍 UI/UX PRO MAX COMPREHENSIVE QA AUDIT');
console.log('================================================================\n');

const auditResults = {
  accessibility: [],
  touchInteraction: [],
  performance: [],
  layoutResponsive: [],
  typographyColor: [],
  motionAnimation: [],
  formsFeedback: []
};

// 1. Audit HTML Files
for (const file of HTML_FILES) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');

  // Accessibility Checks
  // A. lang attribute
  if (!content.includes('<html lang="') && !content.includes("<html lang='")) {
    auditResults.accessibility.push({ file, issue: 'Missing lang="en" on <html> element', severity: 'HIGH' });
  }

  // B. viewport meta
  if (!content.includes('name="viewport"') && !content.includes("name='viewport'")) {
    auditResults.layoutResponsive.push({ file, issue: 'Missing viewport meta tag', severity: 'CRITICAL' });
  } else if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
    auditResults.accessibility.push({ file, issue: 'Viewport disables zoom (user-scalable=no or maximum-scale=1)', severity: 'CRITICAL' });
  }

  // C. Title tag
  if (!content.includes('<title>') || !content.includes('</title>')) {
    auditResults.accessibility.push({ file, issue: 'Missing or empty <title> tag', severity: 'HIGH' });
  }

  // D. Meta description
  if (!content.includes('name="description"') && !content.includes("name='description'")) {
    auditResults.accessibility.push({ file, issue: 'Missing meta description tag', severity: 'MEDIUM' });
  }

  // E. Heading Hierarchy (Check for multiple h1s or missing h1)
  const h1Matches = content.match(/<h1[\s>]/gi) || [];
  if (h1Matches.length === 0) {
    auditResults.accessibility.push({ file, issue: 'No <h1> tag found on page', severity: 'HIGH' });
  } else if (h1Matches.length > 1) {
    auditResults.accessibility.push({ file, issue: `Multiple <h1> tags found (${h1Matches.length})`, severity: 'MEDIUM' });
  }

  // F. Icon buttons without aria-label
  const buttonMatches = content.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (const btn of buttonMatches) {
    // If button has an svg or i tag but no text content and no aria-label
    const hasIcon = /<svg|<i class=/i.test(btn);
    const textOnly = btn.replace(/<[^>]+>/g, '').trim();
    const hasAria = /aria-label=["'][^"']+["']/i.test(btn);
    if (hasIcon && textOnly.length === 0 && !hasAria) {
      const snippet = btn.slice(0, 70).replace(/\s+/g, ' ');
      auditResults.accessibility.push({ file, issue: `Icon-only button missing aria-label: ${snippet}...`, severity: 'CRITICAL' });
    }
  }

  // G. Images missing alt attribute
  const imgMatches = content.match(/<img[\s\S]*?>/gi) || [];
  for (const img of imgMatches) {
    if (!/alt=["'][^"']*["']/i.test(img)) {
      const snippet = img.slice(0, 60).replace(/\s+/g, ' ');
      auditResults.accessibility.push({ file, issue: `Image tag missing alt attribute: ${snippet}...`, severity: 'HIGH' });
    }
  }

  // H. Skip to main content link
  if (!content.includes('skip-link') && !content.includes('skip-to') && !content.includes('Skip to')) {
    auditResults.accessibility.push({ file, issue: 'Missing "Skip to main content" accessibility link', severity: 'MEDIUM' });
  }
}

// 2. Audit CSS Files
for (const file of CSS_FILES) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');

  // A. Focus States: outline: none or outline: 0 without replacement
  const outlineNoneMatches = content.match(/[^{}]*\{[^}]*outline\s*:\s*(none|0)[^}]*\}/gi) || [];
  for (const m of outlineNoneMatches) {
    if (!m.includes('focus-visible') && !m.includes('box-shadow') && !m.includes('border-color')) {
      const selector = m.split('{')[0].trim().replace(/\s+/g, ' ');
      if (selector.includes(':focus') || selector.includes('button') || selector.includes('a') || selector.includes('input')) {
        auditResults.accessibility.push({ file, issue: `Outline removed on interactive elements without focus indicator: ${selector.slice(0, 60)}`, severity: 'CRITICAL' });
      }
    }
  }

  // B. prefers-reduced-motion check
  if (!content.includes('prefers-reduced-motion')) {
    auditResults.motionAnimation.push({ file, issue: 'Missing @media (prefers-reduced-motion) overrides for animations/transitions', severity: 'HIGH' });
  }

  // C. Touch Target sizes
  if (content.includes('min-height: 44px') || content.includes('min-height: 48px') || content.includes('height: 44px')) {
    // Has touch target definition
  } else {
    auditResults.touchInteraction.push({ file, issue: 'No explicit min-height: 44px or 48px touch targets found in stylesheet', severity: 'MEDIUM' });
  }

  // D. Body font size
  const bodyMatch = content.match(/body\s*\{[^}]*\}/i);
  if (bodyMatch) {
    const b = bodyMatch[0];
    const fsMatch = b.match(/font-size\s*:\s*([^;]+);/i);
    if (fsMatch) {
      const val = fsMatch[1].trim();
      if (val.includes('14px') || val.includes('12px') || val.includes('0.8')) {
        auditResults.typographyColor.push({ file, issue: `Body font size is too small (${val}); minimum 16px recommended for mobile legibility`, severity: 'HIGH' });
      }
    }
  }
}

// Output Audit Report
let totalIssues = 0;
for (const [cat, issues] of Object.entries(auditResults)) {
  console.log(`### Category: ${cat.toUpperCase()} (${issues.length} items)`);
  if (issues.length === 0) {
    console.log('  ✓ No issues found.\n');
  } else {
    for (const item of issues) {
      totalIssues++;
      console.log(`  [${item.severity}] ${item.file}: ${item.issue}`);
    }
    console.log('');
  }
}

console.log('================================================================');
console.log(`TOTAL AUDIT ISSUES DETECTED: ${totalIssues}`);
console.log('================================================================');
