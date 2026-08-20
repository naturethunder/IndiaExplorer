/**
 * Repair Engine - fixes problematic images state-by-state with multi-provider search.
 * Supports state checkpointing, dry-run mode, confidence actions, and granular reporting.
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');
const { ImageCache } = require('./cache');
const { ProviderManager } = require('./provider-manager');
const { loadAllImages, getDestMeta, DEST_DIR } = require('./extractor');

class RepairEngine {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.providerManager = new ProviderManager(cache);
    this.apply = options.apply === true || options.dryRun === false;
    this.dryRun = !this.apply;
    this.limit = options.limit || null;
    this.minConfidence = options.minConfidence || 90;
    this.manualReviewThreshold = options.manualReviewThreshold || 80;
    this.filters = options.filters || {};
    this.state = this.filters.state || 'All';
    this.runId = `repair_${Date.now()}`;
    this.stateDir = path.join('reports', 'images', 'states');
    this.ensureDirs();
  }

  ensureDirs() {
    if (!fs.existsSync('reports')) fs.mkdirSync('reports');
    if (!fs.existsSync(path.join('reports', 'images'))) fs.mkdirSync(path.join('reports', 'images'));
    if (!fs.existsSync(this.stateDir)) fs.mkdirSync(this.stateDir, { recursive: true });
  }

  getSafeStateSlug() {
    return this.state.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'all';
  }

  getCheckpointPath() {
    return path.join(this.stateDir, `${this.getSafeStateSlug()}-checkpoint.json`);
  }

  loadCheckpoint() {
    const cpPath = this.getCheckpointPath();
    if (fs.existsSync(cpPath)) {
      try {
        return JSON.parse(fs.readFileSync(cpPath, 'utf8'));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  saveCheckpoint(data) {
    const cpPath = this.getCheckpointPath();
    fs.writeFileSync(cpPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  updateMasterProgress(stateSummary) {
    const progressPath = path.join('reports', 'images', 'india-progress.json');
    let master = {};
    if (fs.existsSync(progressPath)) {
      try {
        master = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
      } catch (e) {}
    }
    master[this.state] = stateSummary;
    fs.writeFileSync(progressPath, JSON.stringify(master, null, 2) + '\n', 'utf8');
  }

  async run() {
    console.log(`\n================================================================`);
    console.log(`  REPAIR ENGINE (${this.dryRun ? 'DRY-RUN' : 'APPLY MODE'})`);
    console.log(`  State Target   : ${this.state}`);
    console.log(`  Min Confidence : ${this.minConfidence} (Auto-Apply)`);
    console.log(`  Manual Review  : ${this.manualReviewThreshold}`);
    console.log(`================================================================\n`);

    // Load all images for target state/destinations
    const images = await loadAllImages(this.filters);

    // Run Level 1 audit to find problems
    const { runLevel1Audit } = require('./audit-level1');
    const level1 = runLevel1Audit(images);

    // Collect broken URLs from CSV report and cache
    const brokenSet = new Set();
    const problemsCsvPath = path.join('reports', config.output.problemsCsv);
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

    const addProblem = (p, issue) => {
      const key = `${p.destSlug}::${p.fieldPath}`;
      if (!seenProblems.has(key)) {
        seenProblems.add(key);
        problems.push({ ...p, issue: issue || p.issue || 'Problematic' });
      }
    };

    // 1. Missing, malformed, placeholder, invalid local path
    for (const p of level1.missingUrl) addProblem(p, 'Missing URL');
    for (const p of level1.malformedUrl) addProblem(p, 'Malformed URL');
    for (const p of level1.placeholder) addProblem(p, 'Placeholder URL');
    for (const p of level1.invalidLocalPath) addProblem(p, 'Invalid Local Path');

    // 2. Broken / 429 HTTP URLs
    for (const img of images) {
      if (brokenSet.has(`${img.destSlug}::${img.fieldPath}`) || brokenSet.has(img.url)) {
        addProblem(img, 'Broken/429 URL');
      }
    }

    // 3. Duplicate URLs
    for (const p of level1.duplicateUrl.filter(d => d.count > 1)) {
      addProblem(p, 'Duplicate URL');
    }

    const totalProblemsAvailable = problems.length;
    console.log(`State Total References       : ${images.length}`);
    console.log(`Problematic Images Available : ${totalProblemsAvailable}`);
    console.log(`Healthy / Untouched Images   : ${images.length - totalProblemsAvailable}`);

    if (this.limit && problems.length > this.limit) {
      console.log(`Applying Batch Limit         : Processing first ${this.limit} records\n`);
      problems.splice(this.limit);
    }

    const checkpoint = this.loadCheckpoint() || {
      state: this.state,
      totalRecords: images.length,
      problematicTotal: totalProblemsAvailable,
      processedCount: 0,
      kept: 0,
      replaced: 0,
      manualReview: 0,
      failed: 0,
      lastProcessedKey: null,
      providerCounts: { wikimedia: 0, pexels: 0, unsplash: 0 },
      cacheHits: 0,
      apiCalls: 0
    };

    const results = {
      state: this.state,
      totalReferences: images.length,
      problematicAvailable: totalProblemsAvailable,
      processed: [],
      autoApplied: [],
      manualReview: [],
      rejected: [],
      failed: [],
      providerCounts: { wikimedia: 0, pexels: 0, unsplash: 0 },
      cacheHits: 0,
      apiCalls: 0,
      potentialWrongMatches: []
    };

    const usedUrlsByDest = new Map();
    const modifiedFiles = new Set();
    const fileCache = new Map();

    const getFile = (destSlug) => {
      if (!fileCache.has(destSlug)) {
        const filePath = path.join(DEST_DIR, `${destSlug}.json`);
        if (fs.existsSync(filePath)) {
          fileCache.set(destSlug, JSON.parse(fs.readFileSync(filePath, 'utf8')));
        }
      }
      return fileCache.get(destSlug);
    };

    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      console.log(`[${i + 1}/${problems.length}] ${problem.destSlug} / ${problem.fieldPath} (${problem.name || problem.destSlug}): ${problem.issue}`);

      try {
        const destMeta = await getDestMeta(problem.destSlug);
        const context = {
          destSlug: problem.destSlug,
          fieldPath: problem.fieldPath,
          name: problem.name,
          type: problem.type,
          state: destMeta?.state || this.state,
          title: destMeta?.title || problem.destSlug,
        };

        // Track cache counts before search
        const initialCacheSize = this.cache.data.providerSearchCache.size;

        // Search for replacements using dynamic priority & cascade
        const candidates = await this.providerManager.search(context);

        if (candidates.length === 0) {
          console.log(`  -> No candidates found. Marked for manual review.`);
          results.failed.push({ ...problem, reason: 'No candidates' });
          checkpoint.failed++;
          continue;
        }

        if (!usedUrlsByDest.has(problem.destSlug)) {
          usedUrlsByDest.set(problem.destSlug, new Set());
        }
        const usedUrls = usedUrlsByDest.get(problem.destSlug);

        // Pick highest confidence candidate that hasn't been used yet in this destination
        const best = candidates.find(c => !usedUrls.has(c.url)) || candidates[0];
        usedUrls.add(best.url);

        const provider = best.provider || 'unknown';
        results.providerCounts[provider] = (results.providerCounts[provider] || 0) + 1;

        console.log(`  -> Best: ${best.url}`);
        console.log(`     Confidence: ${best.confidence}/100 | Provider: ${provider} | Cascade Level: ${best.cascadeLevel}`);

        const recordResult = {
          state: this.state,
          destSlug: problem.destSlug,
          fieldPath: problem.fieldPath,
          name: problem.name,
          type: problem.type,
          oldUrl: problem.url,
          newUrl: best.url,
          provider: best.provider,
          providerImageId: best.id || '',
          confidence: best.confidence,
          cascadeLevel: best.cascadeLevel,
          isFallback: best.isFallback,
          issue: problem.issue,
          title: best.title || best.alt || '',
          photographer: best.photographer || best.author || '',
          license: best.license || 'Provider License',
          status: 'PROCESSED'
        };

        results.processed.push(recordResult);

        // Classify based on Confidence
        if (best.confidence >= this.minConfidence) {
          recordResult.action = this.apply ? 'APPLIED' : 'CANDIDATE_READY';
          results.autoApplied.push(recordResult);
          checkpoint.replaced++;

          if (this.apply) {
            const data = getFile(problem.destSlug);
            if (data) {
              this.setNestedValue(data, problem.fieldPath, best.url, best.title || problem.name);
              modifiedFiles.add(problem.destSlug);
            }
          }
        } else if (best.confidence >= this.manualReviewThreshold) {
          recordResult.action = 'MANUAL_REVIEW_REQUIRED';
          results.manualReview.push(recordResult);
          checkpoint.manualReview++;
        } else {
          recordResult.action = 'REJECTED_LOW_CONFIDENCE';
          results.rejected.push(recordResult);
          results.potentialWrongMatches.push(recordResult);
          checkpoint.kept++;
        }

        checkpoint.processedCount++;
        checkpoint.lastProcessedKey = `${problem.destSlug}::${problem.fieldPath}`;
      } catch (err) {
        console.error(`  Error processing ${problem.destSlug}: ${err.message}`);
        results.failed.push({ ...problem, error: err.message });
        checkpoint.failed++;
      }
    }

    // If apply mode, write modified JSON files to disk
    if (this.apply && modifiedFiles.size > 0) {
      console.log(`\nWriting changes for ${modifiedFiles.size} destination files...`);
      for (const destSlug of modifiedFiles) {
        const data = fileCache.get(destSlug);
        if (data) {
          const filePath = path.join(DEST_DIR, `${destSlug}.json`);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
          console.log(`  Saved: ${filePath}`);
        }
      }
    }

    // Save state checkpoint
    this.saveCheckpoint(checkpoint);

    // Save state reports
    this.generateStateReports(results, checkpoint);

    // Update master India progress
    this.updateMasterProgress({
      status: results.autoApplied.length > 0 && !this.dryRun ? 'completed' : 'tested',
      mode: this.dryRun ? 'dry-run' : 'applied',
      totalReferences: images.length,
      problematicTotal: totalProblemsAvailable,
      processed: results.processed.length,
      highConfidence: results.autoApplied.length,
      manualReview: results.manualReview.length,
      rejected: results.rejected.length,
      providerCounts: results.providerCounts,
      timestamp: new Date().toISOString()
    });

    console.log(`\n================================================================`);
    console.log(`  REPAIR COMPLETED FOR STATE: ${this.state.toUpperCase()}`);
    console.log(`  Total Processed        : ${results.processed.length}`);
    console.log(`  High Confidence (>=${this.minConfidence}) : ${results.autoApplied.length}`);
    console.log(`  Manual Review (${this.manualReviewThreshold}-${this.minConfidence-1})  : ${results.manualReview.length}`);
    console.log(`  Rejected (<${this.manualReviewThreshold})           : ${results.rejected.length}`);
    console.log(`  Reports Written to     : reports/images/states/${this.getSafeStateSlug()}-*`);
    console.log(`================================================================\n`);

    return results;
  }

  setNestedValue(obj, fieldPath, newUrl, alt) {
    const parts = fieldPath.split(/[\.\[\]]/).filter(Boolean);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    if (typeof current[lastPart] === 'object' && current[lastPart] !== null && 'src' in current[lastPart]) {
      current[lastPart].src = newUrl;
      if (alt && !current[lastPart].alt) current[lastPart].alt = alt;
    } else {
      current[lastPart] = newUrl;
    }
  }

  generateStateReports(results, checkpoint) {
    const slug = this.getSafeStateSlug();

    // 1. JSON Report
    const jsonPath = path.join(this.stateDir, `${slug}-image-report.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({
      state: this.state,
      runId: this.runId,
      mode: this.dryRun ? 'dry-run' : 'applied',
      minConfidence: this.minConfidence,
      manualReviewThreshold: this.manualReviewThreshold,
      summary: {
        totalReferences: results.totalReferences,
        problematicAvailable: results.problematicAvailable,
        processed: results.processed.length,
        highConfidence: results.autoApplied.length,
        manualReview: results.manualReview.length,
        rejected: results.rejected.length,
        failed: results.failed.length,
        providerCounts: results.providerCounts
      },
      candidates: results.processed
    }, null, 2) + '\n', 'utf8');

    // 2. Changes CSV
    const changesCsvPath = path.join(this.stateDir, `${slug}-changes.csv`);
    const csvHeader = 'State,Destination,FieldPath,Name,OldUrl,NewUrl,Provider,Confidence,Action,Reason\n';
    const csvRows = results.processed.map(r => 
      `"${r.state}","${r.destSlug}","${r.fieldPath}","${(r.name||'').replace(/"/g, '""')}","${r.oldUrl||''}","${r.newUrl||''}","${r.provider}","${r.confidence}","${r.action}","${r.issue}"`
    ).join('\n');
    fs.writeFileSync(changesCsvPath, csvHeader + csvRows + '\n', 'utf8');

    // 3. Manual Review CSV
    const reviewCsvPath = path.join(this.stateDir, `${slug}-manual-review.csv`);
    const reviewRows = results.manualReview.concat(results.rejected).map(r => 
      `"${r.state}","${r.destSlug}","${r.fieldPath}","${(r.name||'').replace(/"/g, '""')}","${r.oldUrl||''}","${r.newUrl||''}","${r.provider}","${r.confidence}","${r.action}","${r.issue}"`
    ).join('\n');
    fs.writeFileSync(reviewCsvPath, csvHeader + reviewRows + '\n', 'utf8');
  }
}

module.exports = { RepairEngine };