// Regenerates docs/DESTINATIONS.md from the BUILT data layer (data/destinations/*.json),
// so it reflects the full catalog (bulk + legacy), not just the 108 legacy source rows.
// Run after build-json-data.js.
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const DEST_DIR = path.join(ROOT, "data", "destinations");

const idx = JSON.parse(fs.readFileSync(path.join(DEST_DIR, "index.json"), "utf8"));
const MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LABEL = { hill_station: "Hill Station", beach: "Beach", heritage: "Heritage", wildlife: "Wildlife", spiritual: "Spiritual", adventure: "Adventure" };
const typeLabel = t => LABEL[t] || String(t || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

// contiguous-month ranges → "Jan–Mar, Oct–Dec"
function months(arr) {
  const s = [...new Set(arr || [])].sort((a, b) => a - b);
  if (!s.length) return "—";
  if (s.length === 12) return "Jan–Dec";
  const g = []; let a = null, p = null;
  for (const n of s) { if (a === null) { a = n; p = n; } else if (n === p + 1) { p = n; } else { g.push([a, p]); a = n; p = n; } }
  if (a !== null) g.push([a, p]);
  return g.map(x => x[0] === x[1] ? MONTH[x[0]] : MONTH[x[0]] + "–" + MONTH[x[1]]).join(", ");
}
function price(full) {
  let lo = Infinity, hi = 0;
  (full.hotels || []).forEach(s => { const a = s.priceMin != null ? s.priceMin : (full.overview && full.overview.minPrice); const b = s.priceMax != null ? s.priceMax : a; if (a < lo) lo = a; if (b > hi) hi = b; });
  const min = full.overview && full.overview.minPrice;
  if (!isFinite(lo)) lo = min || 0; if (!hi) hi = lo;
  const f = n => "₹" + Number(n).toLocaleString("en-IN");
  return f(lo) + " – " + f(hi);
}

// group summaries by state; pull price range from each full JSON
const byState = {};
idx.destinations.forEach(sum => {
  const full = JSON.parse(fs.readFileSync(path.join(DEST_DIR, sum.slug + ".json"), "utf8"));
  const row = { name: sum.title, type: sum.type, months: (sum.bestTime && sum.bestTime.months) || [], price: price(full) };
  (byState[sum.state] = byState[sum.state] || []).push(row);
});
const states = Object.keys(byState).sort((a, b) => a.localeCompare(b));
const anchor = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const today = new Date().toISOString().slice(0, 10);

let out = "# 🧭 IndiaExplore — Destinations by State\n\n";
out += `> Auto-generated reference: every one of the **${idx.count.toLocaleString("en-US")} destinations** grouped by state/UT,\n`;
out += "> with its **best travel months** and **price per night** (min–max, taken from the\n";
out += "> cheapest and most expensive real listing for that destination).\n>\n";
out += "> Regenerate with `node scripts/build-destinations-doc.js` after data changes.\n";
out += `> Last generated: ${today}.\n\n`;
out += `**${states.length} states/UTs · ${idx.count.toLocaleString("en-US")} destinations**\n\n## Contents\n\n`;
states.forEach(s => { out += `- [${s}](#${anchor(s)}) (${byState[s].length})\n`; });
out += "\n---\n";
states.forEach(s => {
  out += `\n## ${s}\n\n| Destination | Type | Best Months | Price / night |\n|---|---|---|---|\n`;
  byState[s].sort((a, b) => a.name.localeCompare(b.name)).forEach(d => {
    out += `| **${d.name}** | ${typeLabel(d.type)} | ${months(d.months)} | ${d.price} |\n`;
  });
});
fs.writeFileSync(path.join(ROOT, "docs", "DESTINATIONS.md"), out);
console.log("OK: docs/DESTINATIONS.md — " + idx.count + " destinations across " + states.length + " states, " + out.split("\n").length + " lines.");
