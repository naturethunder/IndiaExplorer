/**
 * Flickr Creative Commons / Public Travel Feed API provider
 * 100% Free, No API Key Required, Unlimited Requests
 * Excellent for authentic on-the-ground Indian travel, ghats, temples, nature
 */

class FlickrProvider {
  constructor() {
    this.rateLimit = { requests: 120, per: 60000 };
    this.lastRequest = 0;
    this.requestCount = 0;
    this.resetTime = Date.now() + this.rateLimit.per;
  }

  async search(query, options = {}) {
    await this.waitForRateLimit();

    const cleanTags = query.toLowerCase().replace(/[^a-z0-9]/g, ',');
    const url = `https://api.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(cleanTags)},india,travel&tagmode=any&format=json&nojsoncallback=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ExploreDesh/2.0 (info@exploredesh.com)' }
      });
      clearTimeout(timeout);

      this.requestCount++;
      this.lastRequest = Date.now();

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return this.normalizeResults(data, options);
    } catch (err) {
      clearTimeout(timeout);
      return [];
    }
  }

  async waitForRateLimit() {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + this.rateLimit.per;
    }
  }

  normalizeResults(data, options = {}) {
    return (data.items || []).slice(0, options.limit || 15).map(item => {
      // Flickr image URL replacement:
      // _m.jpg: 240px
      // _z.jpg: 640px
      // _b.jpg: 1024px
      // _k.jpg: 2048px (2K QHD)
      const thumb = item.media?.m || '';
      const url2k = thumb.replace('_m.', '_k.');
      const urlHd = thumb.replace('_m.', '_b.');
      const preview = thumb.replace('_m.', '_z.');

      let author = item.author || 'Flickr Traveler';
      const m = author.match(/\("([^"]+)"\)/);
      if (m) author = m[1];

      return {
        id: `flickr_${item.link?.replace(/[^a-z0-9]/gi, '_') || Math.random()}`,
        provider: 'flickr',
        title: item.title || 'Travel Photo',
        alt: item.title || '',
        width: 2048,
        height: 1365,
        megapixels: '2.8 MP',
        resolutionTier: '2K QHD',
        is4K: false,
        url: url2k,
        previewUrl: urlHd || preview,
        thumbnail: preview,
        photographer: author,
        photographerUrl: item.link,
        license: 'Creative Commons / Flickr Public',
        searchUrl: item.link,
      };
    }).filter(p => p.url);
  }
}

module.exports = { FlickrProvider };
