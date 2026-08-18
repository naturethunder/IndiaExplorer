/**
 * Unsplash API provider for image search
 */

const config = require('../config');

const UNSPLASH_CONFIG = config.providers.unsplash;

class UnsplashProvider {
  constructor(accessKey) {
    this.accessKey = accessKey;
    this.baseUrl = UNSPLASH_CONFIG.baseUrl;
    this.searchEndpoint = UNSPLASH_CONFIG.searchEndpoint;
    this.rateLimit = UNSPLASH_CONFIG.rateLimit;
    this.lastRequest = 0;
    this.requestCount = 0;
    this.resetTime = Date.now() + this.rateLimit.per;
  }

  async search(query, options = {}) {
    if (!this.accessKey) {
      throw new Error('Unsplash access key not configured');
    }

    await this.waitForRateLimit();

    const page = options.page || 1;
    const perPage = options.perPage || UNSPLASH_CONFIG.perPage;

    const url = new URL(`${this.baseUrl}${this.searchEndpoint}`);
    url.searchParams.set('query', query);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('per_page', perPage.toString());
    if (options.orientation) url.searchParams.set('orientation', options.orientation);
    if (options.contentFilter) url.searchParams.set('content_filter', options.contentFilter);

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Client-ID ${this.accessKey}` },
    });

    this.requestCount++;
    this.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeResults(data);
  }

  async waitForRateLimit() {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + this.rateLimit.per;
    }

    if (this.requestCount >= this.rateLimit.requests) {
      throw new Error(`Unsplash rate limit reached (${this.rateLimit.requests}/hr)`);
    }
  }

  normalizeResults(data) {
    return (data.results || []).map(photo => ({
      id: photo.id,
      url: photo.urls?.full || photo.urls?.regular || photo.urls?.small,
      thumbnail: photo.urls?.thumb,
      width: photo.width,
      height: photo.height,
      photographer: photo.user?.name,
      photographerUrl: photo.user?.links?.html,
      alt: photo.alt_description || photo.description || '',
      provider: 'unsplash',
      searchUrl: photo.links?.html,
    })).filter(p => p.url);
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = { UnsplashProvider };