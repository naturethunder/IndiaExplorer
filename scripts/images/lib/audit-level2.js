/**
 * Level 2 Audit: HTTP validation - HEAD/GET requests
 * - Status code
 * - MIME type validation
 * - Timeout handling
 * - Redirect following
 * - Rate limiting with concurrency control
 */

const config = require('../config');
const { ImageCache } = require('./cache');

const LEVEL2_CONFIG = config.audit.level2;

/**
 * HTTP client with retry, timeout, and rate limiting
 */
class HttpClient {
  constructor(options = {}) {
    this.timeout = options.timeout || LEVEL2_CONFIG.timeout;
    this.maxRedirects = options.maxRedirects || LEVEL2_CONFIG.maxRedirects;
    this.followRedirects = options.followRedirects !== false;
    this.validateMime = options.validateMime !== false;
    this.allowedMimes = options.allowedMimes || LEVEL2_CONFIG.allowedMimes;
    this.retry = options.retry || LEVEL2_CONFIG.retry;
    this.concurrency = options.concurrency || LEVEL2_CONFIG.maxConcurrency;
  }

  async request(url, options = {}) {
    const method = options.method || 'HEAD';
    const headers = { 'User-Agent': 'IndiaExplore Image Auditor/1.0', ...options.headers };

    let attempts = 0;
    let lastError;

    while (attempts <= (this.retry?.attempts || 3)) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          redirect: this.followRedirects ? 'follow' : 'manual',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check retryable status codes
        if (this.retry?.retryOn?.includes(response.status) && attempts <= (this.retry?.attempts || 3)) {
          const delay = (this.retry?.backoff || 1000) * Math.pow(this.retry?.backoffMultiplier || 2, attempts - 1);
          await this.sleep(delay);
          continue;
        }

        // Get content-type from headers
        const contentType = response.headers.get('content-type') || '';

        // If HEAD failed or no content-type, try GET for better info
        let finalResponse = response;
        if (method === 'HEAD' && (!contentType || response.status >= 400)) {
          const getResponse = await fetch(url, {
            method: 'GET',
            headers,
            redirect: this.followRedirects ? 'follow' : 'manual',
            signal: new AbortController().signal,
          });
          clearTimeout(timeoutId);
          finalResponse = getResponse;
        }

        return {
          url,
          status: finalResponse.status,
          ok: finalResponse.ok,
          contentType: finalResponse.headers.get('content-type') || '',
          contentLength: finalResponse.headers.get('content-length') || null,
          finalUrl: finalResponse.url,
          redirected: finalResponse.redirected,
        };
      } catch (err) {
        lastError = err;
        if (err.name === 'AbortError') {
          lastError = new Error(`Timeout after ${this.timeout}ms`);
        }

        // Retry on network errors
        if (attempts <= (this.retry?.attempts || 3)) {
          const delay = (this.retry?.backoff || 1000) * Math.pow(this.retry?.backoffMultiplier || 2, attempts - 1);
          await this.sleep(delay);
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Request failed');
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

/**
 * Run Level 2 audit on image entries
 * @param {Array} images - Array of image entries from Level 1 (should be 'ok' items)
 * @param {ImageCache} cache - Cache instance
 * @returns {Promise<Object>} Audit results
 */
async function runLevel2Audit(images, cache) {
  const client = new HttpClient();
  const semaphore = createSemaphore(config.audit.level2.maxConcurrency);

  const results = {
    ok: [],
    broken: [],
    wrongMime: [],
    timeout: [],
    error: [],
    stats: {
      total: images.length,
      ok: 0,
      broken: 0,
      wrongMime: 0,
      timeout: 0,
      error: 0,
    },
  };

  console.log(`Running Level 2 HTTP validation on ${images.length} images (concurrency: ${config.audit.level2.maxConcurrency})...`);

  const processOne = async (img) => {
    await semaphore.acquire();
    try {
      const cached = await cache.getImageByUrl(img.url);
      if (cached && cached.http_status && cached.validation_level >= 2) {
        // Use cached result
        return categorizeResult(img, cached);
      }

      const result = await client.request(img.url);
      const categorized = categorizeResult(img, result);

      // Cache the result
      await cache.upsertImage({
        destSlug: img.destSlug,
        fieldPath: img.fieldPath,
        url: img.url,
        validationStatus: categorized.status,
        validationLevel: 2,
        httpStatus: result.status,
        mimeType: result.contentType,
        lastChecked: new Date().toISOString(),
      });

      return categorized;
    } finally {
      semaphore.release();
    }
  };

  // Process in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const promises = batch.map(processOne);
    const batchResults = await Promise.allSettled(promises);

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        const cat = r.value;
        results[cat.category].push(cat);
        results.stats[cat.category]++;
      } else {
        results.error.push({ ...images[0], issue: r.reason?.message || 'Unknown error' });
        results.stats.error++;
      }
    }

    // Progress
    const processed = Math.min(i + batchSize, images.length);
    if (processed % 200 === 0 || processed === images.length) {
      console.log(`  Progress: ${processed}/${images.length} (OK: ${results.stats.ok}, Broken: ${results.stats.broken})`);
    }
  }

  return results;
}

function categorizeResult(img, result) {
  const base = { ...img, httpStatus: result.status, contentType: result.contentType, finalUrl: result.finalUrl };

  if (!result.ok) {
    return { ...base, category: 'broken', status: 'broken', issue: `HTTP ${result.status}` };
  }

  if (LEVEL2_CONFIG.validateMime) {
    const mime = result.contentType?.split(';')[0]?.trim();
    if (mime && !LEVEL2_CONFIG.allowedMimes.includes(mime)) {
      return { ...base, category: 'wrongMime', status: 'wrong_mime', issue: `Invalid MIME: ${mime}` };
    }
  }

  return { ...base, category: 'ok', status: 'ok', issue: null };
}

function createSemaphore(max) {
  let current = 0;
  const queue = [];

  return {
    acquire() {
      return new Promise(resolve => {
        if (current < max) {
          current++;
          resolve();
        } else {
          queue.push(resolve);
        }
      });
    },
    release() {
      current--;
      if (queue.length > 0) {
        current++;
        queue.shift()();
      }
    },
  };
}

module.exports = { runLevel2Audit, HttpClient };