/**
 * Repair Engine - fixes broken/placeholder images with provider search
 * Supports dry-run mode and confidence-based automatic application
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');
const { ImageCache } = require('./cache');
const { ProviderManager } = require('./provider-manager');
const { loadAllImages, getDestMeta, DEST_DIR } = require('./extractor');

const CONFIDENCE = config.audit.level4;

class RepairEngine {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.providerManager = new ProviderManager(cache);
    this.dryRun = options.dryRun !== false; // Default to dry-run
    this.limit = options.limit || null;
    this.minConfidence = options.minConfidence || CONFIDENCE.autoApplyThreshold;
    this.manualReviewThreshold = options.manualReviewThreshold || CONFIDENCE.manualReviewThreshold;
    this.apply = options.apply === true;
    this.filters = options.filters || {};
    this.runId = `repair_${Date.now()}`;
  }

  async run() {
    console.log(`\n=== Repair Engine (${this.dryRun ? 'DRY-RUN' : 'APPLY'}) ===`);
    console.log(`Run ID: ${this.runId}`);
    console.log(`Min confidence for auto-apply: ${this.minConfidence}`);
    console.log(`Manual review threshold: ${this.manualReviewThreshold}`);

    // Load all images for target destinations
    const images = await loadAllImages(this.filters);

    // Run Level 1 audit to find problems
    const { runLevel1Audit } = require('./audit-level1');
    const level1 = runLevel1Audit(images);

    // Collect broken URLs from CSV report and cache
    const brokenSet = new Set();
    const problemsCsvPath = path.join(__dirname, '..', '..', config.paths.reportsDir, config.output.problemsCsv);
    if (fs.existsSync(problemsCsvPath)) {
      const csvLines = fs.readFileSync(problemsCsvPath, 'utf8').split('\n').filter(Boolean);
      for (const line of csvLines.slice(1)) {
        const parts = line.split(',');
        const dest = parts[0];
        const field = parts[1];
        const url = parts[2];
        const status = parts[3];
        const httpStatus = parts[5];
        if (status === 'broken' || httpStatus === '429' || httpStatus === '404') {
          brokenSet.add(`${dest}::${field}`);
          if (url) brokenSet.add(url.trim());
        }
      }
    }
    for (const entry of this.cache.data.imageCache.values()) {
      if (entry.validationStatus === 'broken' || entry.httpStatus === 429 || entry.httpStatus === 404) {
        brokenSet.add(`${entry.destSlug}::${entry.fieldPath}`);
        if (entry.url) brokenSet.add(entry.url.trim());
      }
    }

    // Collect images needing repair (deduplicated by destSlug + fieldPath)
    const seenProblems = new Set();
    const problems = [];

    const addProblem = (p) => {
      const key = `${p.destSlug}::${p.fieldPath}`;
      if (!seenProblems.has(key)) {
        seenProblems.add(key);
        problems.push(p);
      }
    };

    // 1. Missing, malformed, placeholder, invalid local path
    for (const p of [...level1.missingUrl, ...level1.malformedUrl, ...level1.placeholder, ...level1.invalidLocalPath]) {
      addProblem(p);
    }

    // 2. Broken / 429 HTTP URLs
    for (const img of images) {
      if (brokenSet.has(`${img.destSlug}::${img.fieldPath}`) || brokenSet.has(img.url)) {
        addProblem({ ...img, issue: 'Broken/429 URL' });
      }
    }

    // 3. Duplicate URLs
    for (const p of level1.duplicateUrl.filter(d => d.count > 1)) {
      addProblem(p);
    }

    console.log(`\nFound ${problems.length} images needing repair`);

    if (this.limit) {
      console.log(`Limiting to first ${this.limit} problems`);
      problems.splice(this.limit);
    }

    const results = {
      autoApplied: [],
      manualReview: [],
      failed: [],
      skipped: [],
      stats: { autoApplied: 0, manualReview: 0, failed: 0, skipped: 0 },
    };

    const usedUrlsByDest = new Map();

    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      console.log(`\n[${i + 1}/${problems.length}] ${problem.destSlug} / ${problem.fieldPath}: ${problem.issue}`);

      try {
        const destMeta = await getDestMeta(problem.destSlug);
        const context = {
          destSlug: problem.destSlug,
          fieldPath: problem.fieldPath,
          name: problem.name,
          type: problem.type,
          state: destMeta?.state || '',
          title: destMeta?.title || problem.name,
        };

        // Search for replacements
        const candidates = await this.providerManager.search(context);

        if (candidates.length === 0) {
          console.log(`  No candidates found`);
          results.failed.push({ ...problem, reason: 'No candidates' });
          results.stats.failed++;
          continue;
        }

        if (!usedUrlsByDest.has(problem.destSlug)) {
          usedUrlsByDest.set(problem.destSlug, new Set());
        }
        const usedUrls = usedUrlsByDest.get(problem.destSlug);

        // Pick highest confidence candidate that hasn't been used yet in this destination
        const best = candidates.find(c => !usedUrls.has(c.url)) || candidates[0];
        usedUrls.add(best.url);

        console.log(`  Best candidate: ${best.url} (confidence: ${best.confidence}, provider: ${best.provider})`);

        if (best.confidence >= this.minConfidence) {
          // Auto-apply
          const change = {
            destSlug: problem.destSlug,
            fieldPath: problem.fieldPath,
            name: problem.name,
            type: problem.type,
            oldUrl: problem.url,
            newUrl: best.url,
            confidence: best.confidence,
            provider: best.provider,
            dryRun: this.dryRun,
            appliedAt: this.dryRun ? null : new Date().toISOString(),
          };

          if (!this.dryRun) {
            await this.applyChange(change);
            // Update cache entry so future audits and problem checks see it as valid
            await this.cache.upsertImage({
              destSlug: problem.destSlug,
              fieldPath: problem.fieldPath,
              url: best.url,
              validationStatus: 'ok',
              validationLevel: 2,
              httpStatus: 200,
              mimeType: 'image/jpeg',
              provider: best.provider,
              lastChecked: new Date().toISOString(),
            });
          }

          await this.cache.logChange(change);
          results.autoApplied.push({ ...problem, ...change });
          results.stats.autoApplied++;
          console.log(`  ${this.dryRun ? 'Would apply' : 'Applied'} (confidence ${best.confidence} >= ${this.minConfidence})`);

        } else if (best.confidence >= this.manualReviewThreshold) {
          // Queue for manual review
          await this.cache.addManualReview({
            destSlug: problem.destSlug,
            fieldPath: problem.fieldPath,
            url: problem.url,
            issue: problem.issue,
            confidence: best.confidence,
            suggestedUrl: best.url,
            context: JSON.stringify({ candidates: candidates.slice(0, 3) }),
          });
          results.manualReview.push({ ...problem, bestCandidate: best, allCandidates: candidates.slice(0, 5) });
          results.stats.manualReview++;
          console.log(`  Queued for manual review (confidence ${best.confidence})`);

        } else {
          // Too low confidence
          results.failed.push({ ...problem, bestCandidate: best, reason: `Confidence ${best.confidence} below threshold ${this.manualReviewThreshold}` });
          results.stats.failed++;
          console.log(`  Confidence too low: ${best.confidence} < ${this.manualReviewThreshold}`);
        }

      } catch (err) {
        console.error(`  Error: ${err.message}`);
        results.failed.push({ ...problem, reason: err.message });
        results.stats.failed++;
      }
    }

    // Save checkpoint
    await this.cache.saveCheckpoint(this.runId, 'repair', 4, problems.length, problems.length, 'completed');
    await this.cache.save();

    return results;
  }

  async applyChange(change) {
    const destPath = path.join(DEST_DIR, `${change.destSlug}.json`);
    if (!fs.existsSync(destPath)) {
      throw new Error(`Destination file not found: ${change.destSlug}`);
    }

    const detail = JSON.parse(fs.readFileSync(destPath, 'utf8'));

    // Use destination title for alt text, fallback to original name
    const altText = detail.title || change.name || change.destSlug;

    // Navigate to the field and update
    this.setNestedValue(detail, change.fieldPath, { src: change.newUrl, alt: altText });

    // Write back
    fs.writeFileSync(destPath, JSON.stringify(detail, null, 2), 'utf8');

    // Also update index.json if it's a hero/image field
    if (['heroImage', 'image'].includes(change.fieldPath.split('[')[0])) {
      const indexPath = path.join(DEST_DIR, 'index.json');
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const indexEntry = indexData.destinations.find(d => d.slug === change.destSlug);
      if (indexEntry) {
        if (change.fieldPath === 'heroImage') indexEntry.heroImage = { src: change.newUrl, alt: indexEntry.title };
        if (change.fieldPath === 'image') indexEntry.image = { src: change.newUrl, alt: indexEntry.title };
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
      }
    }
  }

  setNestedValue(obj, path, value) {
    const parts = path.split(/[.\[]+/).map(p => p.replace(']', ''));
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) return false;
      current = current[part];
    }
    const last = parts[parts.length - 1];
    if (current[last] && typeof current[last] === 'object' && 'src' in current[last]) {
      current[last].src = value.src;
      current[last].alt = value.alt || current[last].alt;
    } else if (typeof current[last] === 'string') {
      current[last] = value.src;
    } else if (current[last] && typeof current[last] === 'object') {
      current[last].src = value.src;
      current[last].alt = value.alt;
    } else {
      current[last] = value;
    }
    return true;
  }
}

module.exports = { RepairEngine };