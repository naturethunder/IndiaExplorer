/**
 * Victoria and Albert Museum (V&A) IIIF API Provider
 * 100% Free, No Key Required, Unlimited
 * High-definition architectural photography of Indian monuments, forts, and temples
 */

class VAProvider {
  constructor() {
    this.rateLimit = { requests: 120, per: 60000 };
  }

  async search(query, options = {}) {
    const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query + ' India')}&images=1&page_size=${Math.min(options.limit || 8, 12)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const data = await res.json();

      return (data.records || []).map(item => {
        const imageId = item._primaryImageId;
        if (!imageId) return null;

        // V&A IIIF dynamic scaling (2048px 2K HD)
        const fullUrl = `https://framemark.vam.ac.uk/collections/${imageId}/full/!2048,2048/0/default.jpg`;
        const previewUrl = `https://framemark.vam.ac.uk/collections/${imageId}/full/!800,800/0/default.jpg`;

        return {
          id: `va_${item.systemNumber || imageId}`,
          provider: 'va',
          title: item._primaryTitle || `${query} Historical Architecture`,
          alt: item._primaryTitle || '',
          width: 2048,
          height: 1536,
          url: fullUrl,
          previewUrl: previewUrl,
          thumbnail: previewUrl,
          photographer: item._primaryMaker?.name || 'V&A Museum London',
          photographerUrl: `https://collections.vam.ac.uk/item/${item.systemNumber}`,
          license: 'V&A Open Access (Free to use)',
          searchUrl: `https://collections.vam.ac.uk/item/${item.systemNumber}`,
        };
      }).filter(Boolean);
    } catch (err) {
      clearTimeout(timeout);
      return [];
    }
  }
}

module.exports = { VAProvider };
