/**
 * Wikimedia Commons API provider for image search
 * Uses the public API - no key required
 */

const config = require('../config');

const WM_CONFIG = config.providers.wikimedia;

class WikimediaProvider {
  constructor() {
    this.baseUrl = WM_CONFIG.baseUrl;
    this.rateLimit = WM_CONFIG.rateLimit;
    this.lastRequest = 0;
    this.requestCount = 0;
    this.resetTime = Date.now() + this.rateLimit.per;
  }

  /**
   * Search Wikimedia Commons for images
   * @param {string} query - Search term
   * @param {Object} options - { limit, minWidth, maxResults }
   * @returns {Promise<Array>} Normalized results
   */
  async search(query, options = {}) {
    await this.waitForRateLimit();

    const limit = options.limit || WM_CONFIG.maxResults;
    const gsrlimit = Math.min(limit, 50);

    const url = new URL(this.baseUrl);
    url.searchParams.set('action', 'query');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrsearch', query);
    url.searchParams.set('gsrnamespace', '6'); // File namespace
    url.searchParams.set('gsrlimit', gsrlimit.toString());
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|extmetadata|size');
    url.searchParams.set('iiurlwidth', (options.minWidth || 800).toString());
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'IndiaExploreApp/2.0 (https://indiaexplore.org; info@indiaexplore.org)' },
    });

    this.requestCount++;
    this.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error(`Wikimedia API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data, options);
  }

  async waitForRateLimit() {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + this.rateLimit.per;
    }

    if (this.requestCount >= this.rateLimit.requests) {
      throw new Error(`Wikimedia rate limit reached (${this.rateLimit.requests}/min)`);
    }
  }

  normalizeResults(data, options = {}) {
    const pages = (data.query && data.query.pages) || {};
    const results = [];

    for (const page of Object.values(pages)) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;

      const url = ii.thumburl || ii.url;
      if (!url || !/\.(jpg|jpeg|png|webp)$/i.test(url)) continue;

      // Filter out logos, maps, diagrams, flags
      const title = (page.title || '').toLowerCase();
      if (this.isUnwanted(title, url)) continue;

      // Get dimensions from extmetadata or imageinfo
      let width = ii.width;
      let height = ii.height;
      const meta = ii.extmetadata;
      if (meta?.ImageWidth?.value) width = parseInt(meta.ImageWidth.value);
      if (meta?.ImageHeight?.value) height = parseInt(meta.ImageHeight.value);

      // Get description/artist from extmetadata
      const description = meta?.ImageDescription?.value || '';
      const artist = meta?.Artist?.value || '';
      const license = meta?.LicenseShortName?.value || '';

      results.push({
        id: page.pageid?.toString() || page.title,
        url,
        thumbnail: ii.thumburl || url,
        width,
        height,
        title: page.title,
        description,
        artist,
        license,
        provider: 'wikimedia',
        searchUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      });
    }

    // Filter by minimum dimensions
    if (options.minWidth || options.minHeight) {
      return results.filter(r =>
        (!options.minWidth || (r.width && r.width >= options.minWidth)) &&
        (!options.minHeight || (r.height && r.height >= options.minHeight))
      );
    }

    return results.slice(0, options.limit || WM_CONFIG.maxResults);
  }

  isUnwanted(title, url) {
    const unwantedPatterns = [
      /flag_of/i,
      /coat_of_arms/i,
      /logo_of/i,
      /map_of/i,
      /diagram/i,
      /chart/i,
      /census/i,
      /stamp_of/i,
      /location_map/i,
      /seal_of/i,
      /symbol_of/i,
      /svg$/i, // Skip SVG for now
    ];
    return unwantedPatterns.some(p => p.test(title) || p.test(url));
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = { WikimediaProvider };