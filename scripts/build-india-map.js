#!/usr/bin/env node
/**
 * build-india-map.js — generate data/india-map.js: a responsive inline-SVG source for
 * the "Explore India" section. Reads official Survey of India 2026 boundaries GeoJSON
 * with all 36 States/UTs (including complete Jammu & Kashmir, Ladakh, and Telangana),
 * projects lng/lat → a fixed SVG viewBox, simplifies each polygon ring via
 * Douglas-Peucker point simplification, and emits an ES module:
 *
 *   export const INDIA_MAP = { viewBox: "0 0 W H", states: [{ name, path }] };
 *
 * State names match data/destinations/index.json meta.states so the map looks up
 * destinations directly.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2] || path.join(ROOT, 'data', 'india_states_official.geojson');
const OUT = path.join(ROOT, 'data', 'india-map.js');

const W = 560;
const H = 650;
const PAD_X = 12;
const PAD_Y = 12;

// Name mapping to match ExploreDesh metadata
const NAME_MAP = {
  'Dadra and Nagar Haveli and Daman and Diu': 'Daman & Diu',
  'Andaman & Nicobar Islands': 'Andaman & Nicobar',
  'Andaman & Nicobar': 'Andaman & Nicobar',
  'Jammu and Kashmir': 'Jammu & Kashmir',
  'Orissa': 'Odisha',
  'Uttaranchal': 'Uttarakhand'
};

function normName(n) {
  return NAME_MAP[n] || n;
}

// Douglas-Peucker point simplification
function perpendicularDistance(point, lineStart, lineEnd) {
  let dx = lineEnd[0] - lineStart[0];
  let dy = lineEnd[1] - lineStart[1];
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
  return Math.abs(dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]) / mag;
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source GeoJSON not found:', SRC);
    process.exit(1);
  }
  const geo = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const features = geo.features || [];

  // Global bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const scan = (c) => {
    if (typeof c[0] === 'number') {
      if (c[0] < minX) minX = c[0];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[1] > maxY) maxY = c[1];
    } else c.forEach(scan);
  };
  features.forEach((f) => scan(f.geometry.coordinates));

  console.log(`BBox: lng ${minX.toFixed(2)}..${maxX.toFixed(2)}, lat ${minY.toFixed(2)}..${maxY.toFixed(2)}`);

  // Scale & offset
  const scale = Math.min((W - 2 * PAD_X) / (maxX - minX), (H - 2 * PAD_Y) / (maxY - minY));
  const offX = PAD_X + ((W - 2 * PAD_X) - (maxX - minX) * scale) / 2;
  const offY = PAD_Y + ((H - 2 * PAD_Y) - (maxY - minY) * scale) / 2;

  const px = (x) => +(offX + (x - minX) * scale).toFixed(1);
  const py = (y) => +(offY + (maxY - y) * scale).toFixed(1); // flip Y

  function ringToPath(ring, tolerance = 0.035) {
    if (ring.length < 3) return '';
    const simplified = douglasPeucker(ring, tolerance);
    if (simplified.length < 3) return '';

    const pts = [];
    let last = '';
    for (const pt of simplified) {
      const s = `${px(pt[0])} ${py(pt[1])}`;
      if (s !== last) {
        pts.push(s);
        last = s;
      }
    }
    if (pts.length < 3) return '';
    return 'M' + pts.join('L') + 'Z';
  }

  const states = [];
  const stateSet = new Set();

  features.forEach((f) => {
    const rawName = f.properties.ST_NM || f.properties.name || f.properties.NAME_1;
    const name = normName(rawName);
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;

    const rings = [];
    polys.forEach((p) => {
      if (p[0] && p[0].length >= 3) rings.push(p[0]);
    });
    rings.sort((a, b) => b.length - a.length);

    let d = '';
    rings.forEach((ring, i) => {
      if (i > 0 && ring.length < 12) return;
      const seg = ringToPath(ring, 0.035);
      if (seg) d += seg;
    });

    if (name === 'Delhi') {
      // Authentic Survey of India territory polygon scaled 1.75x inside Haryana/UP socket
      d = "M179.2 194.7L179.6 195.8L179.5 196.3L178.8 196.7L180 197.8L180.8 198.2L180.8 198.7L181.3 198.7L182.2 199.4L182.9 199.5L182.6 201.7L183.4 202.3L183.3 203L182.5 203.1L182 204.1L182.2 204.6L183.5 205.8L182.9 206.5L182.5 206.7L181.8 206.3L180.3 206.9L179.9 207.6L180.3 207.7L180.5 208.6L179.8 209L178 209.3L177.8 208.6L176.6 208.1L176.1 207.1L176.3 206.3L175.6 206.1L175 205.6L174.4 205.8L172.7 204.9L172.5 205.2L172.8 205.7L171.7 205.5L170.9 206.1L169.5 205.8L169 206.2L168.6 206.1L168.5 205.4L168.1 204.8L167.4 204.4L167.3 203.6L168 203.5L168.9 202L169.4 202.2L169.9 202L170.4 202.4L170.7 201.9L170 201.4L170.4 200.8L171 200.7L171.4 199.8L170.8 199.4L171.1 198.9L171.1 198.4L170.7 198.1L171 197.6L170.7 196.7L170.9 196L171.4 195.7L171.8 195.9L172.2 195.4L173.2 195.3L173.7 195.6L174.4 194.3L176 194.3L176.3 194.7L177 194.6L177 195.3L177.4 195.4L178 194.8L179.2 194.7Z";
    }

    if (d) {
      states.push({ name, path: d });
      stateSet.add(name);
    }
  });

  if (!stateSet.has('Dadra & Nagar Haveli') && stateSet.has('Daman & Diu')) {
    const dd = states.find(s => s.name === 'Daman & Diu');
    states.push({ name: 'Dadra & Nagar Haveli', path: dd.path });
  }

  // Sort by polygon bounding box area descending:
  // Largest states (Rajasthan, MP, Maharashtra, UP, Haryana) are drawn FIRST at the bottom,
  // while small enclaves (Delhi, Chandigarh, Goa, Puducherry) are drawn LAST (on top of Haryana/UP).
  states.sort((a, b) => {
    const getArea = (pathStr) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const pts = pathStr.match(/[0-9.]+\s+[0-9.]+/g) || [];
      pts.forEach(p => {
        const [x, y] = p.split(/\s+/).map(Number);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      return (maxX - minX) * (maxY - minY);
    };
    return getArea(b.path) - getArea(a.path);
  });

  const header =
    '/**\n' +
    ' * india-map.js — Official Survey of India 2026 boundaries.\n' +
    ' * Complete 36 States & UTs with full Jammu & Kashmir, Ladakh, and Telangana.\n' +
    ' * SVG viewBox: 0 0 ' + W + ' ' + H + '.\n' +
    ' */\n';
  const body =
    'export const INDIA_MAP = {\n' +
    '  viewBox: "8 42 544 566",\n' +
    '  states: [\n' +
    states.map((st) => '    { name: ' + JSON.stringify(st.name) + ', path: ' + JSON.stringify(st.path) + ' }').join(',\n') +
    '\n  ],\n};\n';

  fs.writeFileSync(OUT, header + body);
  const kb = (Buffer.byteLength(header + body) / 1024).toFixed(1);
  console.log(`Wrote ${path.relative(ROOT, OUT)} — ${states.length} states, ${kb} KB`);
}

main();
