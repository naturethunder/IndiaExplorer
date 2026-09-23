/**
 * scripts/audit_all.js
 * ============================================================
 * Master Unified Audit Runner for ExploreDesh
 *
 * Runs all 3 primary production audit suites:
 *   1. UI/UX Pro Max QA Audit (scripts/ui_ux_qa_audit.js)
 *   2. Technical SEO & Indexing Audit (scripts/seo_audit.js)
 *   3. Media & Destination Integrity Audit (scripts/final-repository-audit.js)
 *
 * Generates an executive pass/fail scorecard and platform health summary.
 */

'use strict';
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🌟 EXPLOREDESH TRIPLE AUDIT SUITE — MASTER RUNNER');
console.log('================================================================\n');

const results = {
  uiUx: { status: 'PENDING', output: '' },
  seo: { status: 'PENDING', output: '' },
  media: { status: 'PENDING', output: '' }
};

// 1. UI/UX QA Audit
console.log('--- [1/3] RUNNING UI/UX QA AUDIT ---');
try {
  const out = execSync('node scripts/ui_ux_qa_audit.js', { cwd: ROOT, encoding: 'utf8' });
  results.uiUx.output = out;
  results.uiUx.status = out.includes('TOTAL AUDIT ISSUES DETECTED: 0') ? 'PASS' : 'WARN';
  console.log(out);
} catch (err) {
  results.uiUx.status = 'FAIL';
  results.uiUx.output = err.stdout || err.message;
  console.error(results.uiUx.output);
}

// 2. SEO & Indexing Audit
console.log('\n--- [2/3] RUNNING TECHNICAL SEO & INDEXING AUDIT ---');
try {
  const out = execSync('node scripts/seo_audit.js', { cwd: ROOT, encoding: 'utf8' });
  const regOut = execSync('node scripts/seo_regression_guard.js', { cwd: ROOT, encoding: 'utf8' });
  results.seo.output = out + '\n' + regOut;
  results.seo.status = (out.includes('ZERO ERRORS FOUND') && regOut.includes('ZERO DEFECTS DETECTED')) ? 'PASS' : 'WARN';
  console.log(out);
  console.log(regOut);
} catch (err) {
  results.seo.status = 'FAIL';
  results.seo.output = err.stdout || err.message;
  console.error(results.seo.output);
}

// 3. Media & Destination Integrity Audit
console.log('\n--- [3/3] RUNNING MEDIA & DESTINATION INTEGRITY AUDIT ---');
try {
  const out = execSync('node scripts/final-repository-audit.js', { cwd: ROOT, encoding: 'utf8' });
  results.media.output = out;
  results.media.status = out.includes('AUDIT PASSED') ? 'PASS' : 'WARN';
  console.log(out);
} catch (err) {
  results.media.status = 'WARN';
  results.media.output = err.stdout || err.message;
  console.log(results.media.output);
}

// Scorecard Summary
console.log('\n================================================================');
console.log('📊 TRIPLE AUDIT SCORECARD');
console.log('================================================================');
console.log(`1. UI/UX Pro Max QA Audit:      [ ${results.uiUx.status} ]`);
console.log(`2. Technical SEO & Indexing:     [ ${results.seo.status} ]`);
console.log(`3. Media & Image Integrity:      [ ${results.media.status} ]`);
console.log('================================================================\n');
