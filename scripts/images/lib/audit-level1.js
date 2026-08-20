/**
 * Level 1 Audit: Cheap, fast checks - no network calls
 * - Missing URL
 * - Malformed URL
 * - Duplicate URL (same URL used multiple times)
 * - Invalid local path
 * - Placeholder patterns (picsum, via.placeholder, etc.)
 */

const config = require('../config');

const PLACEHOLDER_PATTERNS = config.audit.level1.placeholderPatterns;

const JUNK_PATTERNS = [
  '.pdf/',
  '.pdf.jpg',
  'map_showing',
  '_map.jpg',
  'locator_map',
  'location_map',
  'coat_of_arms',
  'logo',
  'diagram',
  'document',
  'page1-500px-thumbnail',
  'ia_'
];

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

function isJunkImage(url) {
  const lower = (url || '').toLowerCase();
  return JUNK_PATTERNS.some(p => lower.includes(p));
}

function isPlaceholder(url) {
  const lower = (url || '').toLowerCase();
  return PLACEHOLDER_PATTERNS.some(p => lower.includes(p)) || isJunkImage(url);
}

function isLocalPath(url) {
  return url.startsWith('images/') || url.startsWith('./images/') || url.startsWith('/images/');
}

function isValidHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function checkLocalPathExists(url) {
  if (!isLocalPath(url)) return true;
  const fs = require('fs');
  const path = require('path');
  const ROOT = path.join(__dirname, '..', '..');
  const localPath = path.join(ROOT, url.replace(/^\.\//, ''));
  return fs.existsSync(localPath);
}

/**
 * Run Level 1 audit on image entries
 * @param {Array} images - Array of { destSlug, fieldPath, url, name, type }
 * @returns {Object} Audit results with categorized issues
 */
function runLevel1Audit(images) {
  const results = {
    ok: [],
    missingUrl: [],
    malformedUrl: [],
    duplicateUrl: [],
    placeholder: [],
    invalidLocalPath: [],
    stats: {
      total: images.length,
      ok: 0,
      missingUrl: 0,
      malformedUrl: 0,
      duplicateUrl: 0,
      placeholder: 0,
      invalidLocalPath: 0,
    },
  };

  // Track URL occurrences for duplicate detection
  const urlCounts = new Map();
  const normalizedUrlMap = new Map();

  // First pass: count URLs
  for (const img of images) {
    const norm = normalizeUrl(img.url);
    urlCounts.set(norm, (urlCounts.get(norm) || 0) + 1);
    normalizedUrlMap.set(img.url, norm);
  }

  // Second pass: categorize
  for (const img of images) {
    const norm = normalizedUrlMap.get(img.url);
    const count = urlCounts.get(norm) || 1;
    const isDuplicate = count > 1;

    // Missing URL
    if (!img.url || img.url.trim() === '') {
      results.missingUrl.push({ ...img, issue: 'Empty URL' });
      results.stats.missingUrl++;
      continue;
    }

    // Malformed URL
    if (!isValidHttpUrl(img.url) && !isLocalPath(img.url)) {
      results.malformedUrl.push({ ...img, issue: 'Invalid URL format' });
      results.stats.malformedUrl++;
      continue;
    }

    // Placeholder
    if (isPlaceholder(img.url)) {
      results.placeholder.push({ ...img, issue: 'Placeholder image', isDuplicate });
      results.stats.placeholder++;
      continue;
    }

    // Invalid local path
    if (isLocalPath(img.url) && !checkLocalPathExists(img.url)) {
      results.invalidLocalPath.push({ ...img, issue: 'Local file not found', isDuplicate });
      results.stats.invalidLocalPath++;
      continue;
    }

    // Duplicate URL (but otherwise valid)
    if (isDuplicate) {
      results.duplicateUrl.push({ ...img, issue: 'Duplicate URL', count });
      results.stats.duplicateUrl++;
      continue;
    }

    // OK
    results.ok.push(img);
    results.stats.ok++;
  }

  return results;
}

module.exports = { runLevel1Audit, normalizeUrl, isPlaceholder, isLocalPath };