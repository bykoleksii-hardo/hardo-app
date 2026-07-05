# What-Hardo-Is LinkedIn carousel

Carousel for Post 2 — **"What Hardo actually is"** (inside the question pool).

## The file to post
- **`hardo-what-is-carousel.pdf`** — 9 pages, 4:5 (1080×1350). Upload to LinkedIn:
  **Create post → Document → select this PDF → title it "What Hardo actually is" → Post.**
- Caption and first-comment text below. Article link goes in the **first comment**, not the post body.

### Caption (post body)
> Most interview prep hands you a list of questions and stops there. It rarely tells you what a good answer actually contains. Here's what's actually inside Hardo's question pool.
>
> #InvestmentBanking #IBRecruiting #InterviewPrep #FinanceCareers #Fintech

### First comment
> The manifesto, what Hardo is and why we built it this way: hardo.app/knowledge/what-is-hardo
> Or just run a free mock and see your first grade: hardo.app

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
