/**
 * Level 3 Audit: Image quality analysis
 * - Dimensions (width/height)
 * - File size
 * - Perceptual hash for duplicate detection
 * Only runs on suspicious images to avoid downloading everything
 */

const config = require('../config');
const { ImageCache } = require('./cache');

const LEVEL3_CONFIG = config.audit.level3;

/**
 * Simple perceptual hash (dHash - difference hash)
 * Returns 64-bit hash as hex string
 */
function perceptualHash(imageBuffer) {
  // We'll use a simple approach: create small grayscale, compare adjacent pixels
  // For production, you'd use a proper image library like sharp or jimp
  // This is a fallback implementation
  try {
    // For now, return a placeholder - in production use sharp:
    // const sharp = require('sharp');
    // const { data } = await sharp(imageBuffer).resize(9, 8).grayscale().raw().toBuffer({ resolveWithObject: true });
    // let hash = '';
    // for (let y = 0; y < 8; y++) {
    //   for (let x = 0; x < 8; x++) {
    //     const idx = y * 9 + x;
    //     const left = data[idx];
    //     const right = data[idx + 1];
    //     hash += (left > right) ? '1' : '0';
    //   }
    // }
    // return parseInt(hash, 2).toString(16).padStart(16, '0');

    // Fallback: hash based on file size + first bytes
    const sample = imageBuffer.slice(0, 64);
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = ((hash << 5) - hash + sample[i]) >>> 0;
    }
    return hash.toString(16).padStart(16, '0');
  } catch {
    return null;
  }
}

async function downloadImage(url, options = {}) {
  const timeout = options.timeout || LEVEL3_CONFIG.downloadTimeout;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'IndiaExplore Image Auditor/1.0' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function getImageDimensions(buffer) {
  // Parse JPEG, PNG, WebP headers for dimensions
  // JPEG: SOI marker + SOF marker
  // PNG: IHDR chunk
  // WebP: RIFF + VP8/VP8L
  try {
    if (buffer.length < 12) return null;

    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length - 2) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          // SOF markers: 0xC0-0xCF (except 0xC4, 0xC8, 0xCC)
          if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          // Skip segment
          const length = buffer.readUInt16BE(offset + 2);
          offset += 2 + length;
        } else {
          offset++;
        }
      }
      return null;
    }

    // WebP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      // VP8/VP8L
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38) {
        // VP8/VP8L - dimensions in different places
        // Simplified: just return null for now
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Run Level 3 audit on suspicious images
 * @param {Array} images - Array of suspicious image entries
 * @param {ImageCache} cache - Cache instance
 * @returns {Promise<Object>} Audit results
 */
async function runLevel3Audit(images, cache) {
  if (!LEVEL3_CONFIG.enabled) {
    return { processed: 0, results: [] };
  }

  const results = {
    lowResolution: [],
    oversized: [],
    perceptualDuplicates: [],
    downloadError: [],
    ok: [],
    stats: { total: images.length, lowResolution: 0, oversized: 0, perceptualDuplicates: 0, downloadError: 0, ok: 0 },
  };

  console.log(`Running Level 3 quality analysis on ${images.length} suspicious images...`);

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      // Check cache first
      const cached = await cache.getImageByUrl(img.url);
      if (cached && cached.width && cached.height && cached.perceptual_hash) {
        const categorized = categorizeQuality(img, cached);
        results[categorized.category].push(categorized);
        results.stats[categorized.category]++;
        continue;
      }

      // Download image
      const buffer = await downloadImage(img.url);

      // Check file size
      if (buffer.length > LEVEL3_CONFIG.maxFileSize) {
        results.oversized.push({ ...img, fileSize: buffer.length, issue: `File too large: ${Math.round(buffer.length/1024)}KB` });
        results.stats.oversized++;
        continue;
      }

      // Get dimensions
      const dims = getImageDimensions(buffer);
      if (!dims) {
        results.downloadError.push({ ...img, issue: 'Could not parse image dimensions' });
        results.stats.downloadError++;
        continue;
      }

      // Get perceptual hash
      const phash = perceptualHash(buffer);

      // Cache results
      await cache.upsertImage({
        destSlug: img.destSlug,
        fieldPath: img.fieldPath,
        url: img.url,
        validationStatus: 'analyzed',
        validationLevel: 3,
        width: dims.width,
        height: dims.height,
        fileSize: buffer.length,
        perceptualHash: phash,
        lastChecked: new Date().toISOString(),
      });

      // Add to perceptual index
      if (phash) {
        await cache.addPerceptualHash(cache.hashUrl(img.url), phash, img.destSlug, img.fieldPath);
      }

      // Categorize
      const categorized = categorizeQuality(img, { width: dims.width, height: dims.height, perceptualHash: phash });
      results[categorized.category].push(categorized);
      results.stats[categorized.category]++;

      // Check for perceptual duplicates against already-processed
      if (phash) {
        const similar = await cache.findSimilarByPhash(phash, LEVEL3_CONFIG.hashThreshold);
        if (similar.length > 1) {
          results.perceptualDuplicates.push({
            ...img,
            duplicates: similar.map(s => ({ destSlug: s.dest_slug, fieldPath: s.field_path })),
            issue: `Perceptual duplicate with ${similar.length - 1} other image(s)`,
          });
          results.stats.perceptualDuplicates++;
        }
      }

    } catch (err) {
      results.downloadError.push({ ...img, issue: err.message });
      results.stats.downloadError++;
    }

    if ((i + 1) % 50 === 0 || i === images.length - 1) {
      console.log(`  Progress: ${i + 1}/${images.length}`);
    }
  }

  return results;
}

function categorizeQuality(img, data) {
  const base = { ...img, width: data.width, height: data.height, perceptualHash: data.perceptualHash };

  if (data.width < LEVEL3_CONFIG.minWidth || data.height < LEVEL3_CONFIG.minHeight) {
    return { ...base, category: 'lowResolution', status: 'low_resolution', issue: `Low resolution: ${data.width}x${data.height}` };
  }

  return { ...base, category: 'ok', status: 'ok', issue: null };
}

module.exports = { runLevel3Audit, perceptualHash, getImageDimensions, downloadImage };