const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

(async () => {
  const dir = __dirname;
  const out = path.join(dir, 'out');
  fs.mkdirSync(out, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  // 1.5x device scale = crisp on LinkedIn (native ~1080w) without bloating file size.
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.join(dir, 'slides.html'), { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; });

  const slides = await page.$$('.slide');
  const imgFiles = [];
  for (let i = 0; i < slides.length; i++) {
    const f = path.join(out, `slide-${String(i + 1).padStart(2, '0')}.jpg`);
    // JPEG compresses the grain texture far better than PNG (random noise = uncompressible in PNG).
    await slides[i].screenshot({ path: f, type: 'jpeg', quality: 90 });
    imgFiles.push(f);
  }
  await browser.close();

  // Build a multi-page PDF from the JPEGs (one slide per page) — the LinkedIn document format.
  const pdf = await PDFDocument.create();
  const W = 1080, H = 1350;
  for (const f of imgFiles) {
    const img = await pdf.embedJpg(fs.readFileSync(f));
    const pg = pdf.addPage([W, H]);
    pg.drawImage(img, { x: 0, y: 0, width: W, height: H });
  }
  const pdfBytes = await pdf.save();
  fs.writeFileSync(path.join(out, 'hardo-why-ib-carousel.pdf'), pdfBytes);

  const mb = (fs.statSync(path.join(out, 'hardo-why-ib-carousel.pdf')).size / 1048576).toFixed(2);
  console.log('OK: rendered ' + imgFiles.length + ' JPGs + ' + pdf.getPageCount() + '-page PDF (' + mb + ' MB)');
})().catch((e) => { console.error('RENDER FAIL:', e.message); process.exit(1); });
