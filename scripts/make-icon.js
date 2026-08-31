// Generates assets/lumen.ico from the SVG logo.
// Run: npm run make-icon
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const svgPath = path.join(__dirname, '..', 'assets', 'icons', 'logo-lumen.svg');
const outIco = path.join(__dirname, '..', 'assets', 'lumen.ico');

async function run(){
  const svg = fs.readFileSync(svgPath);
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  for (const size of sizes){
    const buf = await sharp(svg, { density: 512 })
      .resize(size, size, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
      .png()
      .toBuffer();
    pngBuffers.push(buf);
    console.log('  rendered', size + 'x' + size);
  }
  const ico = await pngToIco(pngBuffers);
  fs.writeFileSync(outIco, ico);
  console.log('Wrote', outIco, '(' + ico.length + ' bytes)');
}

run().catch(e => { console.error(e); process.exit(1); });
