const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

// Usage: node render-carousel.js <input.html> <output-basename>
// Renders each .slide section to a JPG (out/<basename>-NN.jpg) and assembles out/<basename>.pdf
const [,, inputArg, basenameArg] = process.argv;
if (!inputArg || !basenameArg) {
  console.error('Usage: node render-carousel.js <input.html> <output-basename>');
  process.exit(1);
}

(async () => {
  const dir = __dirname;
  const out = path.join(dir, 'out');
  fs.mkdirSync(out, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.join(dir, inputArg), { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; });

  const slides = await page.$$('.slide');
  const imgFiles = [];
  for (let i = 0; i < slides.length; i++) {
    const f = path.join(out, `${basenameArg}-${String(i + 1).padStart(2, '0')}.jpg`);
    await slides[i].screenshot({ path: f, type: 'jpeg', quality: 90 });
    imgFiles.push(f);
  }
  await browser.close();

  const pdf = await PDFDocument.create();
  const W = 1080, H = 1350;
  for (const f of imgFiles) {
    const img = await pdf.embedJpg(fs.readFileSync(f));
    const pg = pdf.addPage([W, H]);
    pg.drawImage(img, { x: 0, y: 0, width: W, height: H });
  }
  const pdfBytes = await pdf.save();
  const pdfPath = path.join(out, `${basenameArg}.pdf`);
  fs.writeFileSync(pdfPath, pdfBytes);

  const mb = (fs.statSync(pdfPath).size / 1048576).toFixed(2);
  console.log('OK: rendered ' + imgFiles.length + ' JPGs + ' + pdf.getPageCount() + '-page PDF (' + mb + ' MB) -> ' + pdfPath);
})().catch((e) => { console.error('RENDER FAIL:', e.message); process.exit(1); });
