/**
 * geo-reference.js — offline geographic reference data + helpers for deriving
 * REAL reach info (nearest airport, nearest railway junction, distances from
 * major cities) from a destination's baked lat/lng.
 *
 * Pure Node stdlib, no network. Used by build-json-data.js to replace the
 * placeholder reach data ("nearest airport" 30 km, "Railway Station" 5 km,
 * generic Delhi/State-capital routes) that the bulk pipeline emitted for
 * ~2,337 destinations. Coordinates are well-known public values (city / airport
 * / junction locations); distances are straight-line (haversine) — clearly
 * labelled as approximate on the page, with real drive-time heuristics layered
 * on top.
 *
 * To extend coverage, just add rows to AIRPORTS / RAILHEADS / CITIES.
 */

// ─── haversine (km) ──────────────────────────────────────
function haversineKm(a, b) {
  if (!a || !b || a[0] == null || b[0] == null) return null;
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ─── Major airports (IATA, name, lat, lng) ───────────────
// Covers every state/UT with at least one commercial airport so the
// nearest-airport lookup is meaningful nationwide.
const AIRPORTS = [
  ['DEL', 'Indira Gandhi International Airport, Delhi', 28.5562, 77.1000],
  ['BOM', 'Chhatrapati Shivaji Maharaj International Airport, Mumbai', 19.0896, 72.8656],
  ['BLR', 'Kempegowda International Airport, Bengaluru', 13.1986, 77.7066],
  ['MAA', 'Chennai International Airport', 12.9941, 80.1709],
  ['CCU', 'Netaji Subhas Chandra Bose International Airport, Kolkata', 22.6547, 88.4467],
  ['HYD', 'Rajiv Gandhi International Airport, Hyderabad', 17.2403, 78.4294],
  ['COK', 'Cochin International Airport, Kochi', 10.1520, 76.4019],
  ['AMD', 'Sardar Vallabhbhai Patel International Airport, Ahmedabad', 23.0772, 72.6347],
  ['PNQ', 'Pune Airport', 18.5822, 73.9197],
  ['GOI', 'Goa International Airport, Dabolim', 15.3808, 73.8314],
  ['GOX', 'Manohar International Airport, Mopa (North Goa)', 15.7360, 73.8580],
  ['JAI', 'Jaipur International Airport', 26.8242, 75.8122],
  ['LKO', 'Chaudhary Charan Singh International Airport, Lucknow', 26.7606, 80.8893],
  ['ATQ', 'Sri Guru Ram Dass Jee International Airport, Amritsar', 31.7096, 74.7973],
  ['IXC', 'Chandigarh International Airport', 30.6735, 76.7885],
  ['NAG', 'Dr. Babasaheb Ambedkar International Airport, Nagpur', 21.0922, 79.0472],
  ['PAT', 'Jay Prakash Narayan Airport, Patna', 25.5913, 85.0880],
  ['BBI', 'Biju Patnaik International Airport, Bhubaneswar', 20.2444, 85.8178],
  ['GAU', 'Lokpriya Gopinath Bordoloi International Airport, Guwahati', 26.1061, 91.5859],
  ['TRV', 'Thiruvananthapuram International Airport', 8.4821, 76.9200],
  ['CCJ', 'Calicut International Airport, Kozhikode', 11.1368, 75.9553],
  ['IXE', 'Mangaluru International Airport', 12.9613, 74.8900],
  ['IXM', 'Madurai Airport', 9.8345, 78.0934],
  ['CJB', 'Coimbatore International Airport', 11.0300, 77.0434],
  ['TRZ', 'Tiruchirappalli International Airport', 10.7654, 78.7097],
  ['VNS', 'Lal Bahadur Shastri Airport, Varanasi', 25.4524, 82.8593],
  ['IXJ', 'Jammu Airport', 32.6890, 74.8374],
  ['SXR', 'Sheikh ul-Alam International Airport, Srinagar', 33.9871, 74.7742],
  ['IXL', 'Kushok Bakula Rimpochee Airport, Leh', 34.1359, 77.5465],
  ['DED', 'Dehradun Airport (Jolly Grant)', 30.1897, 78.1803],
  ['IXB', 'Bagdogra Airport (Siliguri/Darjeeling)', 26.6812, 88.3286],
  ['IXA', 'Maharaja Bir Bikram Airport, Agartala', 23.8870, 91.2404],
  ['IMF', 'Imphal Airport', 24.7600, 93.8967],
  ['DIB', 'Dibrugarh Airport', 27.4839, 95.0169],
  ['JRH', 'Jorhat Airport', 26.7315, 94.1755],
  ['IXS', 'Silchar Airport', 24.9129, 92.9787],
  ['IXR', 'Birsa Munda Airport, Ranchi', 23.3143, 85.3217],
  ['RPR', 'Swami Vivekananda Airport, Raipur', 21.1804, 81.7388],
  ['BHO', 'Raja Bhoj Airport, Bhopal', 23.2875, 77.3374],
  ['IDR', 'Devi Ahilya Bai Holkar Airport, Indore', 22.7218, 75.8011],
  ['JDH', 'Jodhpur Airport', 26.2511, 73.0489],
  ['UDR', 'Maharana Pratap Airport, Udaipur', 24.6177, 73.8961],
  ['IXU', 'Aurangabad Airport', 19.8627, 75.3981],
  ['VGA', 'Vijayawada Airport', 16.5304, 80.7968],
  ['VTZ', 'Visakhapatnam Airport', 17.7211, 83.2245],
  ['TIR', 'Tirupati Airport', 13.6325, 79.5433],
  ['HBX', 'Hubli Airport', 15.3617, 75.0849],
  ['IXZ', 'Veer Savarkar International Airport, Port Blair', 11.6412, 92.7297],
  ['IXG', 'Belagavi Airport', 15.8593, 74.6183],
  ['STV', 'Surat Airport', 21.1141, 72.7417],
  ['RAJ', 'Rajkot Airport', 22.3092, 70.7794],
  ['BDQ', 'Vadodara Airport', 22.3362, 73.2263],
  ['GAY', 'Gaya International Airport', 24.7443, 84.9512],
  ['SHL', 'Shillong Airport (Umroi)', 25.7036, 91.9787],
  ['DMU', 'Dimapur Airport', 25.8839, 93.7711],
  ['PYG', 'Pakyong Airport, Gangtok', 27.2255, 88.5866],
  ['AJL', 'Lengpui Airport, Aizawl', 23.8406, 92.6197],
  ['KUU', 'Kullu-Manali Airport (Bhuntar)', 31.8767, 77.1544],
  ['DHM', 'Kangra Airport (Gaggal), Dharamshala', 32.1651, 76.2634],
  ['SLV', 'Shimla Airport (Jubbarhatti)', 31.0818, 77.0680],
  ['PGH', 'Pantnagar Airport', 29.0334, 79.4737],
  ['KNU', 'Kanpur Airport', 26.4404, 80.3649],
  ['AGR', 'Agra Airport (Pandit Deen Dayal Upadhyay)', 27.1558, 77.9609],
  ['GWL', 'Gwalior Airport', 26.2933, 78.2278],
  ['JLR', 'Jabalpur Airport', 23.1778, 80.0520],
  ['BHU', 'Bhavnagar Airport', 21.7522, 72.1852],
  ['JGA', 'Jamnagar Airport', 22.4655, 70.0126],
  ['DIU', 'Diu Airport', 20.7131, 70.9211],
  ['IXD', 'Prayagraj Airport (Bamrauli)', 25.4401, 81.7339],
  ['KLH', 'Kolhapur Airport', 16.6647, 74.2894],
  ['NDC', 'Nanded Airport', 19.1833, 77.3167],
  ['JLG', 'Jalgaon Airport', 20.9642, 75.6250],
  ['SAG', 'Shirdi Airport', 19.6885, 74.3785],
  ['BEP', 'Bellary Airport', 15.1628, 76.8827],
  ['MYQ', 'Mysuru Airport', 12.2300, 76.6558],
  ['RJA', 'Rajahmundry Airport', 17.1104, 81.8182],
  ['CDP', 'Kadapa Airport', 14.5100, 78.7727],
  ['KJB', 'Kurnool Airport', 15.7100, 78.0589],
  ['PBD', 'Porbandar Airport', 21.6487, 69.6572],
  ['KTU', 'Kota Airport', 25.1602, 75.8456],
  ['BKB', 'Bikaner Airport (Nal)', 28.0706, 73.2072],
];

// ─── Major railway junctions/stations (name, lat, lng) ───
// Big junctions travellers actually railhead to. Nearest-of used for
// destinations without their own station.
const RAILHEADS = [
  ['New Delhi Railway Station', 28.6431, 77.2197],
  ['Mumbai CSMT', 18.9401, 72.8352],
  ['Howrah Junction (Kolkata)', 22.5839, 88.3425],
  ['Chennai Central', 13.0827, 80.2757],
  ['KSR Bengaluru City Junction', 12.9773, 77.5710],
  ['Secunderabad Junction (Hyderabad)', 17.4344, 78.5013],
  ['Ahmedabad Junction', 23.0270, 72.6010],
  ['Pune Junction', 18.5286, 73.8743],
  ['Jaipur Junction', 26.9196, 75.7878],
  ['Lucknow Charbagh', 26.8313, 80.9190],
  ['Kanpur Central', 26.4550, 80.3510],
  ['Patna Junction', 25.6015, 85.1376],
  ['Bhubaneswar Railway Station', 20.2647, 85.8341],
  ['Guwahati Railway Station', 26.1830, 91.7500],
  ['Thiruvananthapuram Central', 8.4880, 76.9520],
  ['Ernakulam Junction (Kochi)', 9.9700, 76.2870],
  ['Coimbatore Junction', 11.0018, 76.9668],
  ['Madurai Junction', 9.9179, 78.1198],
  ['Tiruchirappalli Junction', 10.7970, 78.6890],
  ['Varanasi Junction', 25.3271, 82.9880],
  ['Prayagraj Junction', 25.4470, 81.8250],
  ['Agra Cantt', 27.1580, 77.9938],
  ['Gwalior Junction', 26.2210, 78.1770],
  ['Jhansi Junction', 25.4500, 78.5720],
  ['Bhopal Junction', 23.2680, 77.4030],
  ['Itarsi Junction', 22.6120, 77.7620],
  ['Nagpur Junction', 21.1533, 79.0900],
  ['Jabalpur Junction', 23.1690, 79.9370],
  ['Raipur Junction', 21.2510, 81.6340],
  ['Ranchi Junction', 23.3690, 85.3260],
  ['Dhanbad Junction', 23.7950, 86.4300],
  ['Jammu Tawi', 32.6920, 74.8570],
  ['Amritsar Junction', 31.6340, 74.8590],
  ['Ludhiana Junction', 30.9120, 75.8480],
  ['Ambala Cantt Junction', 30.3610, 76.8380],
  ['Chandigarh Railway Station', 30.6820, 76.8140],
  ['Haridwar Junction', 29.9520, 78.1580],
  ['Dehradun Railway Station', 30.3160, 78.0340],
  ['Kathgodam (Nainital railhead)', 29.2680, 79.5390],
  ['New Jalpaiguri (NJP, Darjeeling/Sikkim railhead)', 26.6870, 88.4090],
  ['Jodhpur Junction', 26.2960, 73.0240],
  ['Udaipur City', 24.5810, 73.6910],
  ['Ajmer Junction', 26.4650, 74.6270],
  ['Kota Junction', 25.1920, 75.8390],
  ['Bikaner Junction', 28.0130, 73.3130],
  ['Jaisalmer Railway Station', 26.9200, 70.9060],
  ['Surat Railway Station', 21.2050, 72.8410],
  ['Vadodara Junction', 22.3110, 73.1810],
  ['Rajkot Junction', 22.2860, 70.7830],
  ['Vijayawada Junction', 16.5170, 80.6240],
  ['Visakhapatnam Junction', 17.7280, 83.3020],
  ['Tirupati Railway Station', 13.6320, 79.4210],
  ['Guntur Junction', 16.3120, 80.4360],
  ['Hubballi Junction', 15.3450, 75.1360],
  ['Mysuru Junction', 12.3110, 76.6390],
  ['Mangaluru Central', 12.8650, 74.8420],
  ['Madgaon Junction (Goa)', 15.2700, 73.9580],
  ['Vasco da Gama (Goa)', 15.3980, 73.8140],
  ['Kalyan Junction (Mumbai)', 19.2400, 73.1300],
  ['Kacheguda (Hyderabad)', 17.3900, 78.4980],
  ['Katra (Vaishno Devi railhead)', 32.9880, 74.9490],
  ['Gaya Junction', 24.7970, 84.9990],
  ['Muzaffarpur Junction', 26.1210, 85.3900],
  ['Katihar Junction', 25.5390, 87.5810],
  ['Siliguri Junction', 26.7160, 88.4270],
  ['Alipurduar Junction', 26.4870, 89.5270],
  ['Dimapur Railway Station', 25.9090, 93.7260],
  ['Agartala Railway Station', 23.8730, 91.2650],
  ['Aurangabad Railway Station', 19.8800, 75.3210],
  ['Solapur Junction', 17.6710, 75.9080],
  ['Nashik Road', 19.9490, 73.8390],
  ['Bilaspur Junction', 22.0790, 82.1440],
  ['Katni Junction', 23.8380, 80.3960],
  ['Satna Junction', 24.5790, 80.8240],
  ['Bareilly Junction', 28.3540, 79.4090],
  ['Moradabad Junction', 28.8340, 78.7710],
  ['Gorakhpur Junction', 26.7590, 83.3730],
  ['Haldwani Railway Station', 29.2200, 79.5210],
  ['Puri Railway Station', 19.8090, 85.8280],
  ['Sambalpur Junction', 21.4670, 83.9760],
  ['Jamshedpur (Tatanagar)', 22.7910, 86.1890],
];

// ─── Major cities for the "Distance from Major Cities" table ──
const CITIES = [
  ['Delhi', 28.6139, 77.2090],
  ['Mumbai', 19.0760, 72.8777],
  ['Bengaluru', 12.9716, 77.5946],
  ['Chennai', 13.0827, 80.2707],
  ['Kolkata', 22.5726, 88.3639],
  ['Hyderabad', 17.3850, 78.4867],
  ['Ahmedabad', 23.0225, 72.5714],
  ['Pune', 18.5204, 73.8567],
  ['Jaipur', 26.9124, 75.7873],
  ['Lucknow', 26.8467, 80.9462],
  ['Chandigarh', 30.7333, 76.7794],
  ['Nagpur', 21.1458, 79.0882],
  ['Bhopal', 23.2599, 77.4126],
  ['Kochi', 9.9312, 76.2673],
  ['Thiruvananthapuram', 8.5241, 76.9366],
  ['Guwahati', 26.1445, 91.7362],
  ['Patna', 25.5941, 85.1376],
  ['Bhubaneswar', 20.2961, 85.8245],
  ['Raipur', 21.2514, 81.6296],
  ['Ranchi', 23.3441, 85.3096],
  ['Dehradun', 30.3165, 78.0322],
  ['Amritsar', 31.6340, 74.8723],
  ['Surat', 21.1702, 72.8311],
  ['Indore', 22.7196, 75.8577],
  ['Coimbatore', 11.0168, 76.9558],
  ['Visakhapatnam', 17.6868, 83.2185],
  ['Vijayawada', 16.5062, 80.6480],
  ['Panaji', 15.4909, 73.8278],
  ['Srinagar', 34.0837, 74.7973],
  ['Jammu', 32.7266, 74.8570],
  ['Shimla', 31.1048, 77.1734],
  ['Udaipur', 24.5854, 73.7125],
  ['Jodhpur', 26.2389, 73.0243],
  ['Varanasi', 25.3176, 82.9739],
  ['Agra', 27.1767, 78.0081],
  ['Mysuru', 12.2958, 76.6394],
  ['Madurai', 9.9252, 78.1198],
  ['Mangaluru', 12.9141, 74.8560],
  ['Siliguri', 26.7271, 88.3953],
  ['Gangtok', 27.3314, 88.6138],
];

function nearest(coord, list) {
  let best = null, bestD = Infinity;
  for (const row of list) {
    const d = haversineKm(coord, [row[row.length - 2], row[row.length - 1]]);
    if (d != null && d < bestD) { bestD = d; best = row; }
  }
  if (!best) return null;
  return { row: best, distance: Math.round(bestD) };
}

// Straight-line → rough road distance (roads wind ~25% longer than crow-flies).
function roadKm(straightKm) {
  return Math.round(straightKm * 1.25);
}

// Drive-time band from a road distance (avg ~50 km/h incl. stops on Indian highways).
function driveTime(roadDistanceKm) {
  if (roadDistanceKm == null) return 'Via road';
  const lo = Math.max(1, Math.round(roadDistanceKm / 60));
  const hi = Math.max(lo + 1, Math.round(roadDistanceKm / 45));
  return lo + '–' + hi + ' hrs';
}

/**
 * Nearest commercial airport to a destination coordinate.
 * → { name, distance } where distance is straight-line km (rounded).
 */
function nearestAirport(lat, lng) {
  const r = nearest([lat, lng], AIRPORTS);
  if (!r) return null;
  return { name: r.row[1], distance: r.distance, iata: r.row[0] };
}

/**
 * Nearest major railway junction/station to a destination coordinate.
 */
function nearestRailway(lat, lng) {
  const r = nearest([lat, lng], RAILHEADS);
  if (!r) return null;
  return { name: r.row[0], distance: r.distance };
}

/**
 * Distance-from-major-cities rows for the reach table, computed from real
 * coords. Returns the N nearest big cities (so the table is locally relevant),
 * each with straight-line + road distance, a drive-time band, rail note and a
 * flight note (only when far enough that people actually fly).
 *   → [{ from, distance, byCar, byTrain, byAir, via }]
 */
function majorCityRoutes(lat, lng, name, limit) {
  limit = limit || 6;
  const rows = CITIES
    .map((c) => ({ city: c[0], km: haversineKm([lat, lng], [c[1], c[2]]) }))
    .filter((r) => r.km != null && r.km > 8)   // drop the destination's own city
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
  return rows.map((r) => {
    const road = roadKm(r.km);
    const air = r.km > 250
      ? 'Fly to nearest airport + road transfer'
      : (r.km > 120 ? 'No direct flight — rail/road faster' : 'Too close to fly');
    return {
      from: r.city,
      distance: road,
      byCar: driveTime(road),
      byTrain: r.km > 60 ? 'Trains to nearest railhead' : 'Local trains / road',
      byAir: air,
      via: 'Straight-line ' + Math.round(r.km) + ' km · road approx.',
    };
  });
}

module.exports = {
  haversineKm, roadKm, driveTime,
  nearestAirport, nearestRailway, majorCityRoutes,
  AIRPORTS, RAILHEADS, CITIES,
};
