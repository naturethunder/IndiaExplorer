/**
 * Report Generators - JSON, CSV, HTML reports
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function arrayToCsv(headers, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerLine = headers.join(',');
  const dataLines = rows.map(row => headers.map(h => escape(row[h])).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Generate all reports from audit/repair results
 */
async function generateReports(results, cache) {
  const reportsDir = path.join(__dirname, '..', '..', '..', config.paths.reportsDir);
  ensureDir(reportsDir);

  // JSON Summary
  if (results.level1 || results.level2 || results.level3) {
    await writeJsonReport(results, reportsDir);
  }

  // Repair results
  if (results.repair) {
    await writeRepairReports(results.repair, reportsDir);
  }

  // CSV reports from cache
  await writeCsvReports(cache, reportsDir);

  // HTML report
  await writeHtmlReport(results, cache, reportsDir);

  console.log(`\nReports written to ${reportsDir}/`);
}

async function writeJsonReport(results, reportsDir) {
  const safeSlice = (arr, n) => (arr && Array.isArray(arr) ? arr.slice(0, n) : []);

  const summary = {
    runId: results.runId,
    timestamp: results.timestamp,
    summary: results.summary,
    level1: results.level1 ? {
      stats: results.level1.stats,
      samples: {
        missingUrl: safeSlice(results.level1.missingUrl, 20),
        malformedUrl: safeSlice(results.level1.malformedUrl, 20),
        placeholder: safeSlice(results.level1.placeholder, 20),
        duplicateUrl: safeSlice(results.level1.duplicateUrl, 20),
        invalidLocalPath: safeSlice(results.level1.invalidLocalPath, 20),
      }
    } : null,
    level2: results.level2 ? {
      stats: results.level2.stats,
      samples: {
        broken: safeSlice(results.level2.broken, 20),
        wrongMime: safeSlice(results.level2.wrongMime, 20),
        timeout: safeSlice(results.level2.timeout, 20),
      }
    } : null,
    level3: results.level3 ? {
      stats: results.level3.stats,
      samples: {
        lowResolution: safeSlice(results.level3.lowResolution, 20),
        perceptualDuplicates: safeSlice(results.level3.perceptualDuplicates, 20),
      }
    } : null,
  };

  const file = path.join(reportsDir, config.output.summaryJson);
  fs.writeFileSync(file, JSON.stringify(summary, null, 2));
  console.log(`  Written: ${file}`);
}

async function writeRepairReports(repair, reportsDir) {
  // Changes CSV
  const changesFile = path.join(reportsDir, config.output.changesCsv);
  const changesHeaders = ['destSlug', 'fieldPath', 'oldUrl', 'newUrl', 'confidence', 'provider', 'dryRun', 'appliedAt'];
  const changesRows = [
    ...repair.autoApplied.map(r => ({
      ...r,
      dryRun: r.dryRun ? 'yes' : 'no',
      appliedAt: r.appliedAt || (r.dryRun ? '' : new Date().toISOString()),
    })),
    ...repair.manualReview.map(r => ({ ...r, dryRun: 'review', appliedAt: '' })),
  ];
  fs.writeFileSync(changesFile, arrayToCsv(changesHeaders, changesRows));
  console.log(`  Written: ${changesFile}`);

  // Manual review CSV
  const reviewFile = path.join(reportsDir, config.output.manualReviewCsv);
  const reviewHeaders = ['destSlug', 'fieldPath', 'issue', 'confidence', 'suggestedUrl', 'provider', 'context'];
  const reviewRows = repair.manualReview.map(r => ({
    destSlug: r.destSlug,
    fieldPath: r.fieldPath,
    issue: r.issue,
    confidence: r.bestCandidate?.confidence,
    suggestedUrl: r.bestCandidate?.url,
    provider: r.bestCandidate?.provider,
    context: r.context,
  }));
  fs.writeFileSync(reviewFile, arrayToCsv(reviewHeaders, reviewRows));
  console.log(`  Written: ${reviewFile}`);
}

async function writeCsvReports(cache, reportsDir) {
  // Problems CSV (from cache)
  const problemsFile = path.join(reportsDir, config.output.problemsCsv);
  const problems = getAllProblems(cache);
  const problemsHeaders = ['destSlug', 'fieldPath', 'url', 'validationStatus', 'validationLevel', 'httpStatus', 'mimeType', 'width', 'height', 'perceptualHash', 'lastChecked', 'notes'];
  fs.writeFileSync(problemsFile, arrayToCsv(problemsHeaders, problems));
  console.log(`  Written: ${problemsFile}`);

  // Duplicates CSV
  const duplicatesFile = path.join(reportsDir, config.output.duplicatesCsv);
  const duplicates = getDuplicates(cache);
  const dupHeaders = ['urlHash', 'count', 'destSlugs', 'fieldPaths'];
  fs.writeFileSync(duplicatesFile, arrayToCsv(dupHeaders, duplicates));
  console.log(`  Written: ${duplicatesFile}`);
}

function getAllProblems(cache) {
  const rows = [];
  for (const entry of cache.data.imageCache.values()) {
    if (entry.validationStatus !== 'ok' && entry.validationStatus !== undefined) {
      rows.push({
        destSlug: entry.destSlug,
        fieldPath: entry.fieldPath,
        url: entry.url,
        validationStatus: entry.validationStatus,
        validationLevel: entry.validationLevel,
        httpStatus: entry.httpStatus,
        mimeType: entry.mimeType,
        width: entry.width,
        height: entry.height,
        perceptualHash: entry.perceptualHash,
        lastChecked: entry.lastChecked,
        notes: entry.notes,
      });
    }
  }
  return rows;
}

function getDuplicates(cache) {
  const urlGroups = new Map();
  for (const entry of cache.data.imageCache.values()) {
    const key = entry.urlHash;
    if (!urlGroups.has(key)) {
      urlGroups.set(key, { count: 0, destSlugs: [], fieldPaths: [] });
    }
    const group = urlGroups.get(key);
    group.count++;
    group.destSlugs.push(entry.destSlug);
    group.fieldPaths.push(entry.fieldPath);
  }
  const results = [];
  for (const [urlHash, group] of urlGroups) {
    if (group.count > 1) {
      results.push({
        urlHash,
        count: group.count,
        destSlugs: group.destSlugs.join(';'),
        fieldPaths: group.fieldPaths.join(';'),
      });
    }
  }
  return results.sort((a, b) => b.count - a.count);
}

async function writeHtmlReport(results, cache, reportsDir) {
  const file = path.join(reportsDir, config.output.htmlReport);

  const summary = results.summary || {};
  const repair = results.repair || {};

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IndiaExplore Image Audit Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #10b981; border-bottom: 1px solid #334155; padding-bottom: 10px; }
    h2 { color: #38bdf8; margin-top: 30px; }
    h3 { color: #fbbf24; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 15px; }
    .card.ok { border-left: 4px solid #10b981; }
    .card.warn { border-left: 4px solid #f59e0b; }
    .card.error { border-left: 4px solid #ef4444; }
    .card h4 { margin: 0 0 5px 0; font-size: 14px; color: #94a3b8; }
    .card .value { font-size: 28px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; background: #1e293b; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-weight: 600; }
    tr:hover { background: #1e293b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-ok { background: #064e3b; color: #10b981; }
    .badge-warn { background: #78350f; color: #fbbf24; }
    .badge-error { background: #7f1d1d; color: #f87171; }
    .url { font-family: monospace; font-size: 12px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .confidence { font-weight: bold; }
    .confidence.high { color: #10b981; }
    .confidence.med { color: #fbbf24; }
    .confidence.low { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 IndiaExplore Image Audit Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    ${results.runId ? `<p>Run ID: <code>${results.runId}</code></p>` : ''}

    <h2>Summary</h2>
    <div class="grid">
      <div class="card ok"><h4>Total Images</h4><div class="value">${summary.totalImages || 0}</div></div>
      <div class="card ok"><h4>Level 1 OK</h4><div class="value">${summary.level1?.ok || 0}</div></div>
      <div class="card warn"><h4>Placeholders</h4><div class="value">${summary.level1?.placeholder || 0}</div></div>
      <div class="card error"><h4>Broken (L2)</h4><div class="value">${summary.level2?.broken || 0}</div></div>
      <div class="card warn"><h4>Low Resolution</h4><div class="value">${summary.level3?.lowResolution || 0}</div></div>
      <div class="card error"><h4>Perceptual Duplicates</h4><div class="value">${summary.level3?.perceptualDuplicates || 0}</div></div>
    </div>

    ${repair.autoApplied?.length ? `
    <h2>Auto-Applied Repairs (${repair.autoApplied.length})</h2>
    <table>
      <thead><tr><th>Destination</th><th>Field</th><th>Old URL</th><th>New URL</th><th>Confidence</th><th>Provider</th></tr></thead>
      <tbody>
        ${repair.autoApplied.slice(0, 50).map(r => `
        <tr>
          <td>${r.destSlug}</td>
          <td>${r.fieldPath}</td>
          <td class="url">${r.oldUrl}</td>
          <td class="url">${r.newUrl}</td>
          <td class="confidence ${r.confidence >= 90 ? 'high' : r.confidence >= 70 ? 'med' : 'low'}">${r.confidence}</td>
          <td>${r.provider}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ` : ''}

    ${repair.manualReview?.length ? `
    <h2>Manual Review Queue (${repair.manualReview.length})</h2>
    <table>
      <thead><tr><th>Destination</th><th>Field</th><th>Issue</th><th>Suggested</th><th>Confidence</th><th>Provider</th></tr></thead>
      <tbody>
        ${repair.manualReview.slice(0, 50).map(r => `
        <tr>
          <td>${r.destSlug}</td>
          <td>${r.fieldPath}</td>
          <td>${r.issue}</td>
          <td class="url">${r.bestCandidate?.url || 'N/A'}</td>
          <td class="confidence ${r.bestCandidate?.confidence >= 90 ? 'high' : r.bestCandidate?.confidence >= 70 ? 'med' : 'low'}">${r.bestCandidate?.confidence || 'N/A'}</td>
          <td>${r.bestCandidate?.provider || 'N/A'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ` : ''}

    <h2>Level 1 Details</h2>
    <h3>Placeholders (${results.level1?.placeholder?.length || 0})</h3>
    <table>
      <thead><tr><th>Destination</th><th>Field</th><th>URL</th><th>Type</th></tr></thead>
      <tbody>
        ${results.level1?.placeholder?.slice(0, 30).map(r => `
        <tr><td>${r.destSlug}</td><td>${r.fieldPath}</td><td class="url">${r.url}</td><td>${r.type}</td></tr>`).join('')}
      </tbody>
    </table>

    <h3>Broken URLs (${results.level2?.broken?.length || 0})</h3>
    <table>
      <thead><tr><th>Destination</th><th>Field</th><th>URL</th><th>Status</th></tr></thead>
      <tbody>
        ${(results.level2?.broken || []).slice(0, 30).map(r => `
        <tr><td>${r.destSlug}</td><td>${r.fieldPath}</td><td class="url">${r.url}</td><td>HTTP ${r.httpStatus}</td></tr>`).join('')}
      </tbody>
    </table>

  </div>
</body>
</html>`;

  fs.writeFileSync(file, html);
  console.log(`  Written: ${file}`);
}

module.exports = { generateReports };