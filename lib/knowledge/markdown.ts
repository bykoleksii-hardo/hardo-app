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

type FootnoteMap = Record<string, string>;

function inline(s: string, footnotes: FootnoteMap, footnoteOrder: string[]): string {
  // First, capture footnote refs [^id] BEFORE escaping (so brackets are intact).
  // We replace them with a placeholder that survives escapeHtml.
  const refs: { id: string }[] = [];
  let work = s.replace(/\[\^([^\]\s]+)\]/g, (_m, id) => {
    refs.push({ id });
    return `\u0000FN\u0000${refs.length - 1}\u0000`;
  });

  let out = escapeHtml(work);

  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code class="bg-[#f5efe2]/10 px-1.5 py-0.5 rounded text-[#d4a04a] font-mono text-[0.92em]">$1</code>');
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#f5efe2] font-semibold">$1</strong>');
  // Italic (avoid matching inside bold)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em class="italic">$2</em>');
  // Images ![alt](url "caption") or ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, url, cap) => {
    const safe = safeImgUrl(url);
    if (!safe) return '';
    const a = alt || '';
    const c = cap ? `<figcaption class="mt-2 text-center font-mono text-[11px] uppercase tracking-widest text-[#f5efe2]/50">${a ? a : cap}</figcaption>` : '';
    return `<figure class="my-8"><img src="${safe}" alt="${a}" loading="lazy" class="w-full rounded border border-[#f5efe2]/10" />${c}</figure>`;
  });
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => {
    const safe = safeUrl(url);
    const ext = /^https?:/i.test(safe);
    const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safe}"${attrs} class="text-[#d4a04a] underline underline-offset-2 decoration-[#d4a04a]/40 hover:decoration-[#d4a04a]">${txt}</a>`;
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
    return `<sup class="ml-0.5"><a href="#fn-${escapeHtml(id)}" id="fnref-${escapeHtml(id)}" class="text-[#d4a04a] font-mono text-[10px] no-underline hover:underline">[${n}]</a></sup>`;
  });

  return out;
}

const CALLOUT_STYLES: Record<string, { label: string; cls: string; accent: string }> = {
  NOTE:    { label: 'Note',    cls: 'border-[#f5efe2]/20 bg-[#f5efe2]/[0.03]', accent: 'text-[#f5efe2]/70' },
  TIP:     { label: 'Tip',     cls: 'border-[#7ab87a]/30 bg-[#7ab87a]/[0.04]', accent: 'text-[#7ab87a]' },
  WARNING: { label: 'Warning', cls: 'border-[#d4a04a]/30 bg-[#d4a04a]/[0.04]', accent: 'text-[#d4a04a]' },
  INSIGHT: { label: 'Insight', cls: 'border-[#d4a04a]/40 bg-[#d4a04a]/[0.06]', accent: 'text-[#d4a04a]' },
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
      html.push(`<pre class="bg-[#050d1a] border border-[#f5efe2]/10 rounded p-4 overflow-x-auto text-sm my-6"><code class="text-[#f5efe2]/80 font-mono">${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^---\s*$/.test(line)) {
      html.push('<hr class="my-10 border-t border-[#f5efe2]/10" />');
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2].trim(), footnotes, footnoteOrder);
      const cls = level === 1
        ? 'font-serif text-4xl text-[#f5efe2] mt-12 mb-6 leading-tight tracking-[-0.01em]'
        : level === 2
          ? 'font-serif text-3xl text-[#f5efe2] mt-10 mb-5 leading-tight tracking-[-0.01em]'
          : 'font-serif text-2xl text-[#f5efe2] mt-8 mb-4 leading-snug';
      html.push(`<h${level} class="${cls}">${text}</h${level}>`);
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
        html.push(`<aside class="my-7 border-l-2 rounded-r ${style.cls} pl-5 pr-4 py-4"><div class="font-mono text-[10.5px] uppercase tracking-widest mb-2 ${style.accent}">${style.label}</div><div class="text-[#f5efe2]/85 leading-relaxed">${inline(rest, footnotes, footnoteOrder)}</div></aside>`);
      } else {
        html.push(`<blockquote class="my-6 border-l-2 border-[#d4a04a]/40 pl-5 py-1 text-[#f5efe2]/75 italic font-serif text-[18px] leading-relaxed">${inline(buf.join(' '), footnotes, footnoteOrder)}</blockquote>`);
      }
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(`<li class="text-[#f5efe2]/80 leading-relaxed pl-1">${inline(lines[i].replace(/^\s*-\s+/, ''), footnotes, footnoteOrder)}</li>`);
        i++;
      }
      html.push(`<ul class="list-disc pl-6 space-y-2 my-5 marker:text-[#d4a04a]/60">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li class="text-[#f5efe2]/80 leading-relaxed pl-1">${inline(lines[i].replace(/^\s*\d+\.\s+/, ''), footnotes, footnoteOrder)}</li>`);
        i++;
      }
      html.push(`<ol class="list-decimal pl-6 space-y-2 my-5 marker:text-[#d4a04a]/60 marker:font-mono marker:text-[12px]">${items.join('')}</ol>`);
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
    html.push(`<p class="text-[#f5efe2]/80 leading-relaxed my-4 text-[16.5px]">${inline(buf.join(' '), footnotes, footnoteOrder)}</p>`);
  }

  // Render footnotes section if any were referenced
  if (footnoteOrder.length > 0) {
    const items = footnoteOrder.map((id, idx) => {
      const n = idx + 1;
      const body = inline(footnotes[id] || '', footnotes, footnoteOrder);
      return `<li id="fn-${escapeHtml(id)}" class="text-[#f5efe2]/70 text-[14px] leading-relaxed"><span class="font-mono text-[11px] text-[#d4a04a] mr-2">[${n}]</span>${body} <a href="#fnref-${escapeHtml(id)}" class="ml-1 text-[#d4a04a]/70 hover:text-[#d4a04a] no-underline" aria-label="Back to text">\u21A9</a></li>`;
    });
    html.push(`<section class="mt-14 pt-6 border-t border-[#f5efe2]/10"><div class="font-mono text-[10.5px] uppercase tracking-widest text-[#f5efe2]/50 mb-4">Footnotes</div><ol class="space-y-3 list-none pl-0">${items.join('')}</ol></section>`);
  }

  return html.join('\n');
}
