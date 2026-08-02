/**
 * http.js — tiny curl-based HTTP helper for the bulk pipeline.
 * Uses curl (not Node fetch) because Node fetch bypasses the corporate proxy
 * on this network while curl honours it (see CLAUDE.md). Serial + backoff.
 */
const { execFileSync } = require('child_process');

const UA = 'IndiaExploreBot/1.0 (site data pipeline; contact: naturethunder8@gmail.com)';

function sleep(ms) {
  // synchronous sleep — the pipeline is deliberately serial (rate-limited APIs)
  const end = Date.now() + ms;
  while (Date.now() < end) { /* busy wait, coarse */ }
}

/**
 * GET a URL and parse JSON. Retries with exponential backoff on failure /
 * HTTP >= 400. Throws after `tries` attempts.
 */
function curlJson(url, opts = {}) {
  const tries = opts.tries || 4;
  const timeout = opts.timeoutSec || 60;
  const headers = ['-H', 'Accept: application/json', '-H', 'User-Agent: ' + UA]
    .concat(opts.accept ? ['-H', 'Accept: ' + opts.accept] : []);
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const out = execFileSync('curl', [
        '-sS', '--fail', '--max-time', String(timeout),
        '--compressed',
        ...headers,
        url,
      ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(out);
    } catch (e) {
      lastErr = e;
      const wait = 1500 * Math.pow(2, i);
      process.stderr.write('  retry ' + (i + 1) + '/' + tries + ' in ' + wait + 'ms (' + (e.message || '').split('\n')[0].slice(0, 120) + ')\n');
      sleep(wait);
    }
  }
  throw lastErr;
}

module.exports = { curlJson, sleep, UA };
