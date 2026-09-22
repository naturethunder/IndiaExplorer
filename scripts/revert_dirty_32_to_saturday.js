const fs = require('fs');
const { execSync } = require('child_process');

const dirty32 = [
  'data/destinations/bambolim-beach.json',
  'data/destinations/banashankari-temple-amargol.json',
  'data/destinations/bijai-garh.json',
  'data/destinations/chandramouleshwara-temple-unkal.json',
  'data/destinations/daksheswara-mahadev-temple.json',
  'data/destinations/dakshineswar-kali-temple.json',
  'data/destinations/dhandayuthapani-swamy-temple.json',
  'data/destinations/gulmarg-wildlife-sanctuary.json',
  'data/destinations/jaipur.json',
  'data/destinations/kalsubai-harishchandragad-wildlife-sanctuary.json',
  'data/destinations/kokarneswarar-temple-thirukokarnam.json',
  'data/destinations/koranganatha-temple.json',
  'data/destinations/kottekkad-temple.json',
  'data/destinations/madan-mohan-temple.json',
  'data/destinations/nadutariappar-temple.json',
  'data/destinations/nahar-singh-mahal.json',
  'data/destinations/neelakanteshwara-temple.json',
  'data/destinations/ootukulangara-bhagavathy-temple-peruvemba.json',
  'data/destinations/our-lady-of-immaculate-conception-church-mt-poinsur.json',
  'data/destinations/pariyur-kondathu-kaliamman.json',
  'data/destinations/pasupateeswarar-temple-karur.json',
  'data/destinations/rajagopalaswamy-temple-mannargudi.json',
  'data/destinations/siddhivinayak-temple-mumbai.json',
  'data/destinations/thirparappu-waterfalls.json',
  'data/destinations/thirumarperu.json',
  'data/destinations/thirumayam-fort.json',
  'data/destinations/thirunadhikkara-cave-temple.json',
  'data/destinations/tirumalai-tamil-nadu.json',
  'data/destinations/tirupalli-mukkudal-tirunethranathar-temple.json',
  'data/destinations/vardhangad-fort.json',
  'data/destinations/wagheshwari-temple.json',
  'data/destinations/yeshwantgad.json'
];

console.log(`Reverting remaining ${dirty32.length} files to Saturday baseline 17833b6e...`);
dirty32.forEach(f => {
  execSync(`git checkout 17833b6e -- "${f}"`, { stdio: 'inherit' });
  console.log('Restored: ' + f);
});

console.log('All 32 files restored to Saturday baseline!');
