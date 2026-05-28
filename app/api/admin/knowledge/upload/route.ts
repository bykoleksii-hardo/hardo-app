import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/roles';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withLogging, logger } from '@/lib/observability';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);
const BUCKET = 'knowledge-media';

function extFromMime(m: string): string {
  switch (m) {
    case 'image/png': return 'png';
    case 'image/jpeg': return 'jpg';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    case 'image/svg+xml': return 'svg';
    default: return 'bin';
  }
}

function safeBase(name: string): string {
  const stem = name.replace(/\.[^/.]+$/, '');
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'image';
}

export const POST = withLogging('POST /api/admin/knowledge/upload', async (req: Request, _ctx: { requestId: string }) => {
  const role = await getUserRole();
  if (role !== 'admin' && role !== 'editor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  const ext = extFromMime(file.type);
  const base = safeBase(file.name || 'image');
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `articles/${stamp}-${rand}-${base}.${ext}`;

  const buf = new Uint8Array(await file.arrayBuffer());

  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(BUCKET).upload(key, buf, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(key);
  return NextResponse.json({ url: data.publicUrl, path: key });
});
