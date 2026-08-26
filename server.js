/**
 * server.js — Local dev server for ExploreDesh with correct MIME types.
 * Run: node server.js
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
  '.mjs' : 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf' : 'font/ttf',
  '.txt' : 'text/plain; charset=utf-8',
  '.xml' : 'application/xml',
  '.webp': 'image/webp',
};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(ROOT, urlPath);

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch (_) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + urlPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const ct  = MIME[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', ct);

  try {
    res.end(fs.readFileSync(filePath));
  } catch (e) {
    res.writeHead(500);
    res.end('500 Server Error');
  }
}).listen(PORT, () => {
  console.log('✅ ExploreDesh server running at http://localhost:' + PORT);
  console.log('   Serving from: ' + ROOT);
  console.log('   Correct MIME types: JS, CSS, JSON, fonts, images');
});
