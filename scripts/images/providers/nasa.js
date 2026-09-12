/**
 * NASA Earth & Landscape Images API Provider
 * 100% Free, No Key Required, Unlimited
 * Ultra-HD satellite and terrain imagery for Himalayan peaks, river valleys, coastal regions
 */

class NASAProvider {
  constructor() {
    this.rateLimit = { requests: 120, per: 60000 };
  }

  async search(query, options = {}) {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const data = await res.json();
      const rawItems = (data.collection?.items || []).slice(0, Math.min(options.limit || 8, 12));

      return rawItems.map(item => {
        const info = item.data?.[0] || {};
        const thumb = item.links?.[0]?.href || '';
        // NASA assets: replace ~small/~thumb with ~large
        const fullUrl = thumb.replace('~thumb.', '~large.').replace('~small.', '~large.');

        return {
          id: `nasa_${info.nasa_id || Math.random()}`,
          provider: 'nasa',
          title: info.title || `${query} Satellite View`,
          alt: info.title || '',
          width: 3840,
          height: 2160,
          url: fullUrl,
          previewUrl: thumb,
          thumbnail: thumb,
          photographer: info.photographer || 'NASA / Earth Observatory',
          photographerUrl: 'https://images.nasa.gov',
          license: 'NASA Public Domain (Free to use)',
          searchUrl: 'https://images.nasa.gov',
        };
      }).filter(p => p.url);
    } catch (err) {
      clearTimeout(timeout);
      return [];
    }
  }
}

module.exports = { NASAProvider };
