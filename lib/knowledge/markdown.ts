/**
 * Tiny zero-dependency Markdown {\u2192} HTML renderer.
 * Supports: # / ## / ### headings, paragraphs, **bold**, *italic*,
 * inline code (backticks), [link](url), unordered lists with -, ordered lists with 1.,
 * fenced code blocks with three backticks.
 *
 * NOT a full Markdown parser. Good enough for early platform articles.
 * Replace with marked or remark once content gets richer.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\u0060([^\u0060]+)\u0060/g, '<code class="bg-[#f5efe2]/10 px-1.5 py-0.5 rounded text-[#d4a04a]">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#f5efe2]">$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#d4a04a] underline hover:text-[#f5efe2]" rel="noopener noreferrer" target="_blank">$1</a>');
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  const FENCE = '\u0060\u0060\u0060';

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith(FENCE)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(FENCE)) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      html.push(`<pre class="bg-[#050d1a] border border-[#f5efe2]/10 rounded p-4 overflow-x-auto text-sm my-6"><code class="text-[#f5efe2]/80">${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2].trim());
      const cls =
        level === 1
          ? 'font-serif text-4xl text-[#f5efe2] mt-12 mb-6'
          : level === 2
          ? 'font-serif text-3xl text-[#f5efe2] mt-10 mb-5'
          : 'font-serif text-2xl text-[#f5efe2] mt-8 mb-4';
      html.push(`<h${level} class="${cls}">${text}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(`<li class="text-[#f5efe2]/80 leading-relaxed">${inline(lines[i].replace(/^\s*-\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ul class="list-disc pl-6 space-y-2 my-5">${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li class="text-[#f5efe2]/80 leading-relaxed">${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol class="list-decimal pl-6 space-y-2 my-5">${items.join('')}</ol>`);
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3})\s+/.test(lines[i]) && !/^\s*-\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !lines[i].startsWith(FENCE)) {
      buf.push(lines[i]);
      i++;
    }
    html.push(`<p class="text-[#f5efe2]/80 leading-relaxed my-4">${inline(buf.join(' '))}</p>`);
  }

  return html.join('\n');
}
