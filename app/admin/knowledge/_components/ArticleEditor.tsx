'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type EditorProps = {
  initial?: {
    id?: string;
    title?: string;
    slug?: string;
    description?: string | null;
    body_md?: string;
    cover_url?: string | null;
    tags?: string[];
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
  const [previewing, setPreviewing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [body, setBody] = useState(initial?.body_md ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status ?? 'draft');

  function submit(nextStatus: 'draft' | 'published') {
    setErr(null);
    setStatus(nextStatus);
    const fd = new FormData();
    if (initial?.id) fd.set('id', initial.id);
    fd.set('title', title);
    fd.set('slug', slug);
    fd.set('description', description ?? '');
    fd.set('body_md', body);
    fd.set('cover_url', coverUrl ?? '');
    fd.set('tags', tags);
    fd.set('status', nextStatus);
    start(async () => {
      const res = await saveAction(fd);
      if (res.error) {
        setErr(res.error);
        return;
      }
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

  async function preview() {
    setPreviewing(true);
    try {
      const html = await previewAction(body);
      setPreviewHtml(html);
    } finally {
      setPreviewing(false);
    }
  }

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

          <Field label="Slug" hint="auto-generated from title if empty">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full font-mono text-[14px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
              placeholder="my-article-slug"
            />
          </Field>

          <Field label="Description" hint="1-2 sentences for the index card and meta description">
            <textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-[14px] leading-relaxed bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded resize-y"
              placeholder="Why this article matters"
            />
          </Field>

          <Field label="Tags" hint="comma-separated, first tag becomes the kicker">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full font-mono text-[13px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
              placeholder="technicals, valuation"
            />
          </Field>

          <Field label="Cover URL" hint="optional, https only">
            <input
              value={coverUrl ?? ''}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full font-mono text-[13px] bg-transparent border border-line focus:border-ink outline-none px-3 py-2 rounded"
              placeholder="https://..."
            />
          </Field>

          <Field label="Body (Markdown)">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="w-full font-mono text-[13px] leading-relaxed bg-paper border border-line focus:border-ink outline-none px-4 py-3 rounded resize-y"
              placeholder="## Section\n\nWrite your article here in markdown."
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="kicker">Preview</div>
            <button
              type="button"
              onClick={preview}
              disabled={previewing || !body}
              className="text-[12.5px] text-ink-2 hover:text-ink disabled:opacity-40"
            >
              {previewing ? 'Rendering...' : 'Refresh preview'}
            </button>
          </div>
          <div className="border border-line rounded p-6 bg-paper min-h-[400px] sticky top-20">
            {!previewHtml ? (
              <div className="text-[13px] text-muted">Click {'\u201c'}Refresh preview{'\u201d'} to render the markdown.</div>
            ) : (
              <article className="prose-hardo" dangerouslySetInnerHTML={{ __html: previewHtml }} />
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
