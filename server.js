/**
 * server.js — High-Performance Local Dev Server for ExploreDesh
 * 
 * Features:
 * - Ultra-fast in-memory cached Gzip compression (cuts 2.3MB JSON down to ~290KB)
 * - ETag generation & If-None-Match support (returns 304 Not Modified in < 1ms)
 * - Smart Cache-Control headers for static assets, JSON data, and HTML
 * - Clean URLs support (/destinations -> destinations.html, /about -> about.html)
 * - Comprehensive MIME type map & zero-dependency native Node.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript))/i;

// In-memory cache for compressed static payloads: Map<key, { mtimeMs, buffer }>
const gzipCache = new Map();

function checkFile(relPath) {
  const fullPath = path.normalize(path.join(ROOT, relPath));
  if (fullPath.toLowerCase().startsWith(ROOT.toLowerCase())) {
    try {
      const st = fs.statSync(fullPath);
      if (st.isFile()) return { fullPath, stat: st };
    } catch (_) {}
  }
  const stubPath = path.normalize(path.join(ROOT, 'stubs', relPath));
  const stubsRoot = path.join(ROOT, 'stubs');
  if (stubPath.toLowerCase().startsWith(stubsRoot.toLowerCase())) {
    try {
      const st = fs.statSync(stubPath);
      if (st.isFile()) return { fullPath: stubPath, stat: st };
    } catch (_) {}
  }
  return null;
}

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost:' + PORT);
    let urlPath = decodeURIComponent(parsedUrl.pathname);

    // 1. Direct file match
    let match = checkFile(urlPath);

    // 2. Trailing slash / -> /index.html
    if (!match && urlPath.endsWith('/')) {
      match = checkFile(urlPath + 'index.html');
    }

    // 3. Clean path without trailing slash
    const cleanPath = urlPath.endsWith('/') && urlPath !== '/' ? urlPath.slice(0, -1) : urlPath;

    // 4. Try appending .html (e.g. /destinations -> destinations.html)
    if (!match && !path.extname(cleanPath)) {
      match = checkFile(cleanPath + '.html') || checkFile('/stubs' + cleanPath + '.html');
    }

    // 5. Handle nested destination paths (/destination/goa -> destination.html)
    if (!match && (cleanPath.startsWith('/destination/') || cleanPath.startsWith('/destinations/'))) {
      const parts = cleanPath.split('/').filter(Boolean);
      if (parts.length === 2) {
        const slug = parts[1];
        match = checkFile('/stubs/' + slug + '.html') || checkFile('/' + slug + '.html') || checkFile('/destination.html');
      }
    }

    if (!match) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }

    const { fullPath, stat } = match;
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    // Fast ETag based on file size and mtime
    const etag = 'W/"' + stat.size.toString(16) + '-' + Math.floor(stat.mtimeMs).toString(16) + '"';

    // Check If-None-Match for instantaneous 304 Not Modified
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        'ETag': etag,
        'Cache-Control': (ext === '.html' || ext === '.json') ? 'no-cache' : 'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      });
      res.end();
      return;
    }

    // Determine cache control: dev server always revalidates code & data immediately
    let cacheControl = 'public, max-age=86400, stale-while-revalidate=3600';
    if (ext === '.html' || ext === '.json' || ext === '.js' || ext === '.css') {
      cacheControl = 'no-cache, must-revalidate';
    }

    const headers = {
      'Content-Type': contentType,
      'ETag': etag,
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');

    if (acceptsGzip && COMPRESSIBLE.test(contentType)) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';

      // Check in-memory gzip cache
      const cacheKey = fullPath;
      const cached = gzipCache.get(cacheKey);
      if (cached && cached.mtimeMs === stat.mtimeMs) {
        headers['Content-Length'] = cached.buffer.length;
        res.writeHead(200, headers);
        res.end(cached.buffer);
        return;
      }

      // Read and compress
      fs.readFile(fullPath, (readErr, rawData) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Server Error');
          return;
        }
        zlib.gzip(rawData, { level: 6 }, (gzipErr, gzipped) => {
          if (gzipErr) {
            delete headers['Content-Encoding'];
            headers['Content-Length'] = rawData.length;
            res.writeHead(200, headers);
            res.end(rawData);
            return;
          }
          // Store in gzip cache if > 4KB
          if (gzipped.length > 4096) {
            gzipCache.set(cacheKey, { mtimeMs: stat.mtimeMs, buffer: gzipped });
          }
          headers['Content-Length'] = gzipped.length;
          res.writeHead(200, headers);
          res.end(gzipped);
        });
      });
    } else {
      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Server Error');
  }
});

server.listen(PORT, () => {
  console.log('⚡ ExploreDesh High-Performance Dev Server running:');
  console.log('   http://localhost:' + PORT + '/');
  console.log('   Gzip Compression + ETag 304 Caching Active.');
});
