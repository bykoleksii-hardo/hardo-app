# Why-IB LinkedIn carousel

Carousel for Post 3 — **"Why investment banking? Good answer vs bad answer"** (with the follow-up demo).

## The file to post
- **`hardo-why-ib-carousel.pdf`** — 9 pages, 4:5 (1080×1350). Upload to LinkedIn:
  **Create post → Document → select this PDF → title it "Why investment banking?" → Post.**
- Put the article link in the **first comment**, not the post body. Caption + first-comment text
  live in `hardo-linkedin-launch-kit.md` (section "POST 3 — Carousel version").

## How it's built (reproducible)
Slides are plain HTML/CSS rendered headless — text stays perfectly crisp, and any edit is a 2-second rebuild.

- `slides.html` — the 9 slides. Brand palette ink `#11161E` / cream `#F2ECDF` / paper `#FBF7EE` /
  navy `#0E1E36` / gold `#B88736`, Liberation Serif (Times-family, = the site's serif fallback).
  Includes the HARDO logo lockup, the radial-ring brand motif, and a fine film-grain.
- `render.js` — screenshots each slide (JPEG, 1.5× = crisp without bloat) and assembles the PDF.

### Rebuild
```bash
npm i puppeteer pdf-lib
node render.js        # → ./out/hardo-why-ib-carousel.pdf + ./out/slide-01..09.jpg
```

> Note: JPEG (not PNG) is intentional — the grain texture is random noise, which PNG can't compress
> (a PNG build of this deck is ~45 MB vs ~6 MB JPEG).
