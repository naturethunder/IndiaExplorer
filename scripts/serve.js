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

const server = http.createServer(function (req, res) {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    const file = path.normalize(path.join(ROOT, urlPath));
    // never escape the site root
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

    fs.stat(file, function (err, st) {
      if (err || !st.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + urlPath);
        return;
      }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const headers = { 'Content-Type': type, 'Cache-Control': 'no-cache' };
      const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      const stream = fs.createReadStream(file);
      if (acceptsGzip && COMPRESSIBLE.test(type)) {
        headers['Content-Encoding'] = 'gzip';
        headers['Vary'] = 'Accept-Encoding';
        res.writeHead(200, headers);
        stream.pipe(zlib.createGzip()).pipe(res);
      } else {
        headers['Content-Length'] = st.size;
        res.writeHead(200, headers);
        stream.pipe(res);
      }
    });
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(PORT, function () {
  console.log('IndiaExplore dev server running:');
  console.log('  http://localhost:' + PORT + '/');
  console.log('Ctrl+C to stop.');
});
