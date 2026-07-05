# What-Hardo-Is LinkedIn carousel

Carousel for Post 2 — **"What Hardo actually is"** (inside the question pool).

## The file to post
- **`hardo-what-is-carousel.pdf`** — 9 pages, 4:5 (1080×1350). Upload to LinkedIn:
  **Create post → Document → select this PDF → title it "What Hardo actually is" → Post.**
- Caption and first-comment text below. Article link goes in the **first comment**, not the post body.

### Caption (post body)
The final user-approved caption lives in `hardo-linkedin-launch-kit.md`, section "POST 2 — Carousel
version" (hook: "You can read every 'top 50 IB interview questions' list..."). Use that text verbatim,
it is kept in sync with the slides (997 questions, three candidate levels).

### First comment
> The longer story, what Hardo is and why we built it this way: hardo.app/knowledge/what-is-hardo
> Run a free mock and see your first letter grade: hardo.app

Append `?utm_source=linkedin&utm_medium=organic&utm_campaign=what_is_hardo` to both links.

## How it's built (reproducible)
Same system as the Why-IB carousel (`marketing/carousel-why-ib/`): plain HTML/CSS rendered headless,
so text stays crisp and any edit is a fast rebuild. Shares the palette (ink `#11161E` / cream `#F2ECDF` /
paper `#FBF7EE` / navy `#0E1E36` / gold `#B88736`), the HARDO logo lockup, the radial-ring brand motif,
and the film grain.

- `slides-post2.html` — the 9 slides.
- `render-carousel.js` — generic renderer (JPEG screenshots + PDF assembly), takes the HTML file and
  an output basename as arguments so it can render any carousel in this kit, not just this one.

### Rebuild
```bash
npm i puppeteer pdf-lib
node render-carousel.js slides-post2.html hardo-what-is-carousel
# → ./out/hardo-what-is-carousel.pdf + ./out/hardo-what-is-carousel-01..09.jpg
```
