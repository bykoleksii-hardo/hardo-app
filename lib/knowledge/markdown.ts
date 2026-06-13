/**
 * Tiny zero-dependency Markdown -> HTML renderer for HARDO knowledge articles.
 *
 * Supports:
 *   - headings:           #, ##, ###
 *   - paragraphs
 *   - emphasis:           **bold**, *italic*
 *   - inline code:        `code`
 *   - links:              [text](url)
 *   - images:             ![alt](url) or ![alt](url "caption")
 *   - unordered lists:    - item
 *   - ordered lists:      1. item
 *   - fenced code blocks: triple-backtick fences
 *   - blockquotes:        > text
 *   - callouts:           > [!NOTE] / [!TIP] / [!WARNING] / [!INSIGHT] body
 *   - footnotes:          inline [^1] referencing [^1]: definition at bottom
 *   - horizontal rule:    ---
 *
 * Not a full Markdown parser. Designed to be safe (escapes HTML) and elegant.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(u: string): string {
  const trimmed = u.trim();
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed;
  return '#';
}

function safeImgUrl(u: string): string {
  const trimmed = u.trim();
  if (/^(https?:|\/)/i.test(trimmed)) return trimmed;
  return '';
}

/** URL-safe id for heading anchors / deep links. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[*_`#]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

type FootnoteMap = Record<string, string>;

function inline(s: string, footnotes: FootnoteMap, footnoteOrder: string[]): string {
  // First, capture footnote refs [^id] BEFORE escaping (so brackets are intact).
  // We replace them with a placeholder that survives escapeHtml.
  const refs: { id: string }[] = [];
  const work = s.replace(/\[\^([^\]\s]+)\]/g, (_m, id) => {
    refs.push({ id });
    return `\u0000FN\u0000${refs.length - 1}\u0000`;
  });

  let out = escapeHtml(work);

  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code class="bg-ink/[0.04] px-1.5 py-0.5 rounded text-[#a87a1f] font-mono text-[0.92em]">$1</code>');
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>');
  // Italic (avoid matching inside bold)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em class="italic">$2</em>');
  // Images ![alt](url "caption") or ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, url, cap) => {
    const safe = safeImgUrl(url);
    if (!safe) return '';
    const a = alt || '';
    const c = cap ? `<figcaption class="mt-2 text-center font-mono text-[11px] uppercase tracking-widest text-ink/55">${a ? a : cap}</figcaption>` : '';
    return `<figure class="my-8"><img src="${safe}" alt="${a}" loading="lazy" class="w-full rounded border border-ink/10" />${c}</figure>`;
  });
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => {
    const safe = safeUrl(url);
    const ext = /^https?:/i.test(safe);
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safe}"${attrs} class="text-[#a87a1f] underline underline-offset-2 decoration-[#a87a1f]/40 hover:decoration-[#a87a1f]">${txt}</a>`;
  });

  // Resolve footnote placeholders.
  out = out.replace(/\u0000FN\u0000(\d+)\u0000/g, (_m, idxStr) => {
    const idx = Number(idxStr);
    const id = refs[idx].id;
    if (!(id in footnotes)) {
      // unresolved — render plain bracket text
      return `[^${escapeHtml(id)}]`;
    }
    let order = footnoteOrder.indexOf(id);
    if (order === -1) { footnoteOrder.push(id); order = footnoteOrder.length - 1; }
    const n = order + 1;
    return `<sup class="ml-0.5"><a href="#fn-${escapeHtml(id)}" id="fnref-${escapeHtml(id)}" class="text-[#a87a1f] font-mono text-[10px] no-underline hover:underline">[${n}]</a></sup>`;
  });

  return out;
}

const CALLOUT_STYLES: Record<string, { label: string; cls: string; accent: string }> = {
  NOTE:    { label: 'Note',    cls: 'border-ink/15 bg-ink/[0.03]', accent: 'text-ink/75' },
  TIP:     { label: 'Tip',     cls: 'border-[#3d7a3d]/30 bg-[#3d7a3d]/[0.06]', accent: 'text-[#3d7a3d]' },
  WARNING: { label: 'Warning', cls: 'border-[#a87a1f]/40 bg-[#d4a04a]/[0.08]', accent: 'text-[#a87a1f]' },
  INSIGHT: { label: 'Insight', cls: 'border-[#a87a1f]/50 bg-[#d4a04a]/[0.10]', accent: 'text-[#a87a1f]' },
};

export function renderMarkdown(md: string): string {
  // 1) Pre-pass: extract footnote definitions [^id]: text (can span multiple lines until blank)
  const footnotes: FootnoteMap = {};
  const footnoteOrder: string[] = [];
  const srcLines = md.replace(/\r\n/g, '\n').split('\n');
  const remaining: string[] = [];
  for (let i = 0; i < srcLines.length; i++) {
    const m = /^\[\^([^\]\s]+)\]:\s?(.*)$/.exec(srcLines[i]);
    if (m) {
      const id = m[1];
      let body = m[2];
      let j = i + 1;
      while (j < srcLines.length && /^\s{2,}\S/.test(srcLines[j])) {
        body += ' ' + srcLines[j].trim();
        j++;
      }
      footnotes[id] = body.trim();
      i = j - 1;
      continue;
    }
    remaining.push(srcLines[i]);
  }

  const lines = remaining;
  const html: string[] = [];
  let i = 0;
  const FENCE = '\u0060\u0060\u0060';

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (line.startsWith(FENCE)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(FENCE)) { buf.push(lines[i]); i++; }
      i++;
      html.push(`<pre class="bg-[#050d1a] border border-ink/10 rounded p-4 overflow-x-auto text-sm my-6"><code class="text-ink/85 font-mono">${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^---\s*$/.test(line)) {
      html.push('<hr class="my-10 border-t border-ink/10" />');
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      // The page <h1> is the article title; clamp body headings to <h2>+ so a
      // stray "# " can't emit a second <h1> and break the heading outline.
      const tagLevel = Math.max(2, level);
      const text = inline(h[2].trim(), footnotes, footnoteOrder);
      const cls = level === 1
        ? 'font-serif text-4xl text-ink mt-12 mb-6 leading-tight tracking-[-0.01em] scroll-mt-24'
        : level === 2
          ? 'font-serif text-3xl text-ink mt-10 mb-5 leading-tight tracking-[-0.01em] scroll-mt-24'
          : 'font-serif text-2xl text-ink mt-8 mb-4 leading-snug scroll-mt-24';
      const id = slugify(h[2].trim());
      html.push(`<h${tagLevel}${id ? ` id="${id}"` : ''} class="${cls}">${text}</h${tagLevel}>`);
      i++;
      continue;
    }

    // Blockquote / callout
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const first = buf[0] || '';
      const calloutM = /^\[!(NOTE|TIP|WARNING|INSIGHT)\]\s*(.*)$/i.exec(first);
      if (calloutM) {
        const kind = calloutM[1].toUpperCase();
        const rest = [calloutM[2], ...buf.slice(1)].filter(Boolean).join(' ');
        const style = CALLOUT_STYLES[kind] || CALLOUT_STYLES.NOTE;
        html.push(`<aside class="my-7 border-l-2 rounded-r ${style.cls} pl-5 pr-4 py-4"><div class="font-mono text-[10.5px] uppercase tracking-widest mb-2 ${style.accent}">${style.label}</div><div class="text-ink leading-relaxed">${inline(rest, footnotes, footnoteOrder)}</div></aside>`);
      } else {
        html.push(`<blockquote class="my-6 border-l-2 border-[#a87a1f]/50 pl-5 py-1 text-ink/80 italic font-serif text-[18px] leading-relaxed">${inline(buf.join(' '), footnotes, footnoteOrder)}</blockquote>`);
      }
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(`<li class="text-ink/85 leading-relaxed pl-1">${inline(lines[i].replace(/^\s*-\s+/, ''), footnotes, footnoteOrder)}</li>`);
        i++;
      }
      html.push(`<ul class="list-disc pl-6 space-y-2 my-5 marker:text-[#a87a1f]/70">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li class="text-ink/85 leading-relaxed pl-1">${inline(lines[i].replace(/^\s*\d+\.\s+/, ''), footnotes, footnoteOrder)}</li>`);
        i++;
      }
      html.push(`<ol class="list-decimal pl-6 space-y-2 my-5 marker:text-[#a87a1f]/70 marker:font-mono marker:text-[12px]">${items.join('')}</ol>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Standalone image on its own line (treat as block figure)
    if (/^!\[[^\]]*\]\([^)]+\)\s*$/.test(line)) {
      html.push(inline(line, footnotes, footnoteOrder));
      i++;
      continue;
    }

    // Paragraph
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].startsWith(FENCE) &&
      !lines[i].startsWith('>') &&
      !/^---\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    html.push(`<p class="text-ink/85 leading-relaxed my-4 text-[16.5px]">${buf.map((bl) => inline(bl, footnotes, footnoteOrder)).join('<br />')}</p>`);
  }

  // Render footnotes section if any were referenced
  if (footnoteOrder.length > 0) {
    const items = footnoteOrder.map((id, idx) => {
      const n = idx + 1;
      const body = inline(footnotes[id] || '', footnotes, footnoteOrder);
      return `<li id="fn-${escapeHtml(id)}" class="text-ink/75 text-[14px] leading-relaxed"><span class="font-mono text-[11px] text-[#a87a1f] mr-2">[${n}]</span>${body} <a href="#fnref-${escapeHtml(id)}" class="ml-1 text-[#a87a1f]/80 hover:text-[#a87a1f] no-underline" aria-label="Back to text">\u21A9</a></li>`;
    });
    html.push(`<section class="mt-14 pt-6 border-t border-ink/10"><div class="font-mono text-[10.5px] uppercase tracking-widest text-ink/55 mb-4">Footnotes</div><ol class="space-y-3 list-none pl-0">${items.join('')}</ol></section>`);
  }

  return html.join('\n');
}

export type TocItem = { level: number; text: string; slug: string };

/** Extracts H2/H3 headings (skipping code fences) for an article table of contents. */
export function extractHeadings(md: string): TocItem[] {
  const out: TocItem[] = [];
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const FENCE = '```';
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith(FENCE)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const raw = m[2].trim();
    const text = raw
      .replace(/\*\*|\*|`/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim();
    out.push({ level: m[1].length, text, slug: slugify(raw) });
  }
  return out;
}
