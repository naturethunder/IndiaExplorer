#!/usr/bin/env node
/**
 * serve.js — zero-dependency static file server (pure Node, no npm).
 * ES modules + fetch()ed JSON need http:// — file:// blocks both.
 *
 * Usage:  node scripts/serve.js [port]     (default 8080)
 * Then open http://localhost:8080/
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2], 10) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
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
};

// Text-ish assets that compress well (JSON manifest is ~2 MB → ~290 KB gzipped).
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript))/;

function checkFile(relPath) {
  const fullPath = path.normalize(path.join(ROOT, relPath));
  if (fullPath.startsWith(ROOT)) {
    try {
      const st = fs.statSync(fullPath);
      if (st.isFile()) return fullPath;
    } catch (e) {}
  }
  const stubPath = path.normalize(path.join(ROOT, 'stubs', relPath));
  if (stubPath.startsWith(path.join(ROOT, 'stubs'))) {
    try {
      const st = fs.statSync(stubPath);
      if (st.isFile()) return stubPath;
    } catch (e) {}
  }
  return null;
}

const server = http.createServer(function (req, res) {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost:' + PORT);
    let urlPath = decodeURIComponent(parsedUrl.pathname);

    // 1. Direct file match
    let targetFile = checkFile(urlPath);

    // 2. Trailing slash (e.g. / -> /index.html, /destinations/ -> /destinations/index.html)
    if (!targetFile && urlPath.endsWith('/')) {
      targetFile = checkFile(urlPath + 'index.html');
    }

    // 3. Clean path without trailing slash
    const cleanPath = urlPath.endsWith('/') && urlPath !== '/' ? urlPath.slice(0, -1) : urlPath;

    // 4. Try appending .html (e.g. /destinations -> /destinations.html, /about -> /about.html, /stubs/goa.html)
    if (!targetFile && !path.extname(cleanPath)) {
      targetFile = checkFile(cleanPath + '.html') || checkFile('/stubs' + cleanPath + '.html');
    }

    // 5. Handle nested destination paths (e.g. /destination/goa -> /stubs/goa.html or /destination.html)
    if (!targetFile && (cleanPath.startsWith('/destination/') || cleanPath.startsWith('/destinations/'))) {
      const parts = cleanPath.split('/').filter(Boolean);
      if (parts.length === 2) {
        const slug = parts[1];
        targetFile = checkFile('/stubs/' + slug + '.html') || checkFile('/' + slug + '.html') || checkFile('/destination.html');
      }
    }

    if (!targetFile) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }

    const type = MIME[path.extname(targetFile).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Cache-Control': 'no-cache' };
    const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const stream = fs.createReadStream(targetFile);

    if (acceptsGzip && COMPRESSIBLE.test(type)) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      const st = fs.statSync(targetFile);
      headers['Content-Length'] = st.size;
      res.writeHead(200, headers);
      stream.pipe(res);
    }
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(PORT, function () {
  console.log('IndiaExplore dev server running:');
  console.log('  http://localhost:' + PORT + '/');
  console.log('Ctrl+C to stop.');
});
