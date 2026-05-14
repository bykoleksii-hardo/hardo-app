'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ARTICLE_CATEGORIES, type ArticleCategory } from '@/lib/knowledge/categories';

type EditorProps = {
  initial?: {
    id?: string;
    title?: string;
    slug?: string;
    description?: string | null;
    body_md?: string;
    cover_url?: string | null;
    tags?: string[];
    category?: ArticleCategory;
    status?: 'draft' | 'published';
  };
  saveAction: (formData: FormData) => Promise<{ id?: string; error?: string }>;
  deleteAction?: (formData: FormData) => Promise<{ error?: string }>;
  previewAction: (md: string) => Promise<string>;
};

export default function ArticleEditor({ initial, saveAction, deleteAction, previewAction }: EditorProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slugLocked, setSlugLocked] = useState(true);

  // Auto-derive slug from title unless user has manually edited it.
  useEffect(() => {
    if (slugEdited) return;
    const auto = title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
    setSlug(auto);
  }, [title, slugEdited]);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [body, setBody] = useState(initial?.body_md ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '');
  const [category, setCategory] = useState<ArticleCategory>(initial?.category ?? 'Knowledge Hub');
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status ?? 'draft');

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Debounced live preview.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const html = await previewAction(body);
        if (!cancelled) setPreviewHtml(html);
      } catch {
        if (!cancelled) setPreviewHtml('');
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [body, previewAction]);

  function submit(nextStatus: 'draft' | 'published') {
    setErr(null);
    setInfo(null);
    if (!title.trim()) { setErr('Title is required'); return; }
    if (!body.trim()) { setErr('Body is required'); return; }
    if (!ARTICLE_CATEGORIES.includes(category)) { setErr('Choose a category'); return; }
    setStatus(nextStatus);
    const fd = new FormData();
    if (initial?.id) fd.set('id', initial.id);
    fd.set('title', title);
    fd.set('slug', slug);
    fd.set('description', description ?? '');
    fd.set('body_md', body);
    fd.set('cover_url', coverUrl ?? '');
    fd.set('tags', tags);
    fd.set('category', category);
    fd.set('status', nextStatus);
    start(async () => {
      const res = await saveAction(fd);
      if (res.error) { setErr(res.error); return; }
      router.push('/admin/knowledge');
      router.refresh();
    });
  }

  function destroy() {
    if (!initial?.id || !deleteAction) return;
    if (!confirm('Delete this article? This cannot be undone.')) return;
    const fd = new FormData();
    fd.set('id', initial.id);
    start(async () => {
      const res = await deleteAction(fd);
      if (res.error) { setErr(res.error); return; }
      router.push('/admin/knowledge');
      router.refresh();
    });
  }

  // Toolbar helpers — manipulate the body textarea selection.
  function applyAround(before: string, after: string, placeholder = '') {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function applyLinePrefix(prefix: string, placeholder: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const lineStart = body.lastIndexOf('\n', start - 1) + 1;
    const segEnd = end;
    const seg = body.slice(lineStart, segEnd) || placeholder;
    const transformed = seg
      .split('\n')
      .map((l) => (l.length ? prefix + l : prefix + placeholder))
      .join('\n');
    const next = body.slice(0, lineStart) + transformed + body.slice(segEnd);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = lineStart + transformed.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function insertBlock(snippet: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const needsLead = start > 0 && body[start - 1] !== '\n';
    const prefix = needsLead ? '\n\n' : '';
    const next = body.slice(0, start) + prefix + snippet + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function uploadImage(file: File, into: 'body' | 'cover') {
    setErr(null);
    setInfo(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/admin/knowledge/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setErr(json.error || `Upload failed (${res.status})`);
        return;
      }
      if (into === 'cover') {
        setCoverUrl(json.url);
        setInfo('Cover image uploaded');
      } else {
        const alt = file.name.replace(/\.[^/.]+$/, '');
        insertBlock(`![${alt}](${json.url})\n`);
        setInfo('Image inserted');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload error');
    } finally {
      setUploading(false);
    }
  }

  function onPickBodyImage() { fileRef.current?.click(); }
  function onPickCoverImage() { coverFileRef.current?.click(); }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readMins = Math.max(1, Math.round(wordCount / 220));

  return (
    <div className="max-w-page mx-auto px-6 pt-10 pb-20">
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin/knowledge" className="text-[12.5px] font-mono uppercase tracking-widest text-muted hover:text-ink">
          {'\u2190'} Back to articles
        </Link>
        <div className="flex items-center gap-2">
          {initial?.id && deleteAction && (
            <button
              type="button"
              onClick={destroy}
              disabled={pending}
              className="text-[12.5px] text-[#9A2A2A] hover:underline px-3 py-2"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => submit('draft')}
            disabled={pending || !title || !body}
            className="text-[13px] border border-ink text-ink px-4 py-2 rounded-full hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => submit('published')}
            disabled={pending || !title || !body}
            className="text-[13px] bg-ink text-paper px-4 py-2 rounded-full hover:bg-navy disabled:opacity-40"
          >
            {status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-6 border border-[#9A2A2A] bg-[#9A2A2A]/10 text-[#9A2A2A] text-[13px] px-4 py-3 rounded">
          {err}
        </div>
      )}
      {info && !err && (
        <div className="mb-6 border border-line text-ink-2 text-[13px] px-4 py-3 rounded bg-cream">
          {info}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-serif text-[28px] font-medium leading-tight bg-transparent border-b border-line focus:border-ink outline-none py-2"
              placeholder="Article title"
            />
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Category" hint="required">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                className="w-full text-[14px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
              >
                {ARTICLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="URL slug" hint={slugLocked ? 'auto from title' : 'editing — be careful, changes the public URL'}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-ink/50 shrink-0">/knowledge/</span>
                <input
                  value={slug}
                  readOnly={slugLocked}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                  className={`w-full font-mono text-[13px] bg-transparent border focus:outline-none px-3 py-2 rounded ${slugLocked ? 'border-line/60 text-ink/60 cursor-default' : 'border-ink text-ink'}`}
                  placeholder="auto-generated-from-title"
                />
                <button
                  type="button"
                  onClick={() => setSlugLocked((v) => !v)}
                  className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-ink/60 hover:text-ink border border-line hover:border-ink px-2 py-1 rounded transition"
                >
                  {slugLocked ? 'Edit' : 'Lock'}
                </button>
              </div>
            </Field>
          </div>

          <Field label="SEO description" hint="≤160 chars — shows in Google and link previews (LinkedIn, Telegram, etc.)">
            <textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-[14px] leading-relaxed bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded resize-y"
              placeholder="One or two sentences that make someone want to click. Keep it under 160 characters."
            />
            <div className="mt-1 text-[11px] font-mono text-ink/40 flex justify-end">
              <span className={(description ?? '').length > 160 ? 'text-red-600' : ''}>{(description ?? '').length}/160</span>
            </div>
          
          </Field>

          <Field label="Cover image" hint="optional, displayed on the article header">
            <div className="flex items-center gap-2">
              <input
                value={coverUrl ?? ''}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="flex-1 font-mono text-[13px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
                placeholder="https://... or upload"
              />
              <button
                type="button"
                onClick={onPickCoverImage}
                disabled={uploading}
                className="text-[12.5px] border border-line text-ink-2 hover:text-ink hover:border-ink px-3 py-2 rounded disabled:opacity-40"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, 'cover');
                  e.target.value = '';
                }}
              />
            </div>
          </Field>

          <Field label="Body" hint={`Markdown {\u00b7} ${wordCount} words {\u00b7} ~${readMins} min`}>
            <div className="border border-line rounded focus-within:border-ink bg-paper overflow-hidden">
              <Toolbar
                onBold={() => applyAround('**', '**', 'bold')}
                onItalic={() => applyAround('*', '*', 'italic')}
                onH2={() => applyLinePrefix('## ', 'Section')}
                onH3={() => applyLinePrefix('### ', 'Subsection')}
                onUl={() => applyLinePrefix('- ', 'item')}
                onOl={() => applyLinePrefix('1. ', 'item')}
                onQuote={() => applyLinePrefix('> ', 'quote')}
                onCode={() => applyAround('`', '`', 'code')}
                onLink={() => {
                  const url = prompt('Link URL');
                  if (!url) return;
                  applyAround('[', `](${url})`, 'text');
                }}
                onImage={onPickBodyImage}
                onCallout={(kind) => insertBlock(`> [!${kind}] Your highlight here.\n`)}
                onFootnote={() => {
                  const id = prompt('Footnote id (e.g. 1, source, key)');
                  if (!id) return;
                  const def = prompt('Footnote text');
                  if (!def) return;
                  insertBlock(`[^${id}]\n\n[^${id}]: ${def}\n`);
                }}
                onHr={() => insertBlock('---\n')}
                uploading={uploading}
              />
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={22}
                className="w-full font-mono text-[13px] leading-relaxed bg-paper outline-none px-4 py-3 resize-y border-t border-line"
                placeholder={'## Section\n\nWrite your article in markdown.\n\n> [!INSIGHT] Use callouts to highlight a key idea.\n\nAdd footnotes like this[^1].\n\n[^1]: Footnote text.'}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, 'body');
                  e.target.value = '';
                }}
              />
            </div>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="kicker">Live preview</div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted">{wordCount} words {'\u00b7'} {readMins} min read</div>
          </div>
          <div className="border border-line rounded p-6 bg-[#0a1422] min-h-[400px] sticky top-20 max-h-[80vh] overflow-y-auto">
            {previewHtml ? (
              <article className="prose-hardo" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <div className="text-[13px] text-muted">Start typing to see the rendered article.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10.5px] uppercase tracking-widest text-muted mb-1.5">
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-muted-2">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

type ToolbarProps = {
  onBold: () => void;
  onItalic: () => void;
  onH2: () => void;
  onH3: () => void;
  onUl: () => void;
  onOl: () => void;
  onQuote: () => void;
  onCode: () => void;
  onLink: () => void;
  onImage: () => void;
  onCallout: (kind: 'NOTE' | 'TIP' | 'WARNING' | 'INSIGHT') => void;
  onFootnote: () => void;
  onHr: () => void;
  uploading: boolean;
};

function Toolbar(p: ToolbarProps) {
  const [calloutOpen, setCalloutOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-cream/40 border-b border-line text-[12.5px]">
      <TBtn label="B" title="Bold (** **)" onClick={p.onBold} bold />
      <TBtn label="I" title="Italic (* *)" onClick={p.onItalic} italic />
      <TBtn label="H2" title="Heading 2" onClick={p.onH2} />
      <TBtn label="H3" title="Heading 3" onClick={p.onH3} />
      <Sep />
      <TBtn label={'\u2022 List'} title="Bulleted list" onClick={p.onUl} />
      <TBtn label="1. List" title="Numbered list" onClick={p.onOl} />
      <TBtn label="Quote" title="Blockquote" onClick={p.onQuote} />
      <TBtn label="Code" title="Inline code" onClick={p.onCode} mono />
      <Sep />
      <TBtn label="Link" title="Insert link" onClick={p.onLink} />
      <TBtn label={p.uploading ? 'Uploading...' : 'Image'} title="Upload image" onClick={p.onImage} disabled={p.uploading} />
      <div className="relative">
        <TBtn label="Callout" title="Insert callout" onClick={() => setCalloutOpen((v) => !v)} />
        {calloutOpen && (
          <div className="absolute z-30 mt-1 left-0 bg-paper border border-line rounded shadow-md p-1 min-w-[140px]">
            {(['NOTE', 'TIP', 'WARNING', 'INSIGHT'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setCalloutOpen(false); p.onCallout(k); }}
                className="block w-full text-left px-3 py-1.5 text-[13px] hover:bg-cream rounded"
              >
                {k.charAt(0) + k.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      <TBtn label="Footnote" title="Insert footnote" onClick={p.onFootnote} />
      <TBtn label={'\u2014\u2014'} title="Horizontal rule" onClick={p.onHr} />
    </div>
  );
}

function TBtn({ label, title, onClick, bold, italic, mono, disabled }: { label: string; title: string; onClick: () => void; bold?: boolean; italic?: boolean; mono?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`px-2 py-1 rounded hover:bg-paper border border-transparent hover:border-line text-ink-2 hover:text-ink disabled:opacity-40 ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${mono ? 'font-mono' : ''}`}
    >
      {label}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 inline-block w-px h-4 bg-line align-middle" aria-hidden />;
}
