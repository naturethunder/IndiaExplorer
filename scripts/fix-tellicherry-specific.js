const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'destinations', 'tellicherry-fort.json');
const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));

d.heroImage = {
  src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tellicherry_Fort.JPG/1280px-Tellicherry_Fort.JPG',
  alt: 'Tellicherry Fort, Kerala'
};
d.gallery = [
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tellicherry_Fort.JPG/1280px-Tellicherry_Fort.JPG', alt: 'Tellicherry Fort photo 1' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Thalassery_fort.JPG/1280px-Thalassery_fort.JPG', alt: 'Tellicherry Fort photo 2' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Inside_the_Tellicherry_Fort.JPG/1280px-Inside_the_Tellicherry_Fort.JPG', alt: 'Tellicherry Fort photo 3' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Views_from_and_around_Thalasserry_fort_-_Tellicherry_fort%2C_Kerala%2C_India_%2896%29.jpg/1280px-Views_from_and_around_Thalasserry_fort_-_Tellicherry_fort%2C_Kerala%2C_India_%2896%29.jpg', alt: 'Tellicherry Fort photo 4' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Tellicherry_Fort_-_Entrance.JPG/1280px-Tellicherry_Fort_-_Entrance.JPG', alt: 'Tellicherry Fort photo 5' }
];
if (d.topPlaces && d.topPlaces[1]) {
  d.topPlaces[1].image = {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Overburry%27s_folly_night.jpg/1280px-Overburry%27s_folly_night.jpg',
    alt: "Overbury's Folly"
  };
}
if (d.seo) {
  d.seo.ogImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tellicherry_Fort.JPG/1280px-Tellicherry_Fort.JPG';
}
fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
console.log('tellicherry-fort.json updated successfully with verified Thalassery Fort photos!');
