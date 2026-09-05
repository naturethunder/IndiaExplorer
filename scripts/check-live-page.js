const http = require('http');
function getUrl(url) {
  return new Promise(function(resolve, reject) {
    http.get(url, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() { resolve({ status: res.statusCode, data: data }); });
    }).on('error', reject);
  });
}

getUrl('http://localhost:8080/destination.html?slug=rohtasgarh-fort').then(function(r) {
  var html = r.data;
  var idx1 = html.indexOf('&lt;a href');
  if (idx1 >= 0) console.log('Found &lt;a href at', idx1, ':', html.substring(Math.max(0, idx1-50), idx1+200));
  else console.log('No &lt;a href found');
  
  // heroImg tag
  var heroIdx = html.indexOf('id="heroImg"');
  if (heroIdx >= 0) console.log('heroImg:', html.substring(heroIdx, heroIdx+200));
  
  // Check if server is static or SPA (destination.html is likely static, JS runs in browser)
  console.log('Page is static HTML (JS runs in browser). <a href= would appear if it is in the HTML template itself.');
  console.log('Template hero section lines (from source):');
  var start = html.indexOf('dest-hero');
  if (start >= 0) console.log(html.substring(start, start + 500));
});
