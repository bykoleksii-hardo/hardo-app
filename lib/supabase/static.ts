import { createClient } from '@supabase/supabase-js';

/**
 * Cookieless, RLS-aware Supabase client (anon key) for reading PUBLIC content
 * inside cached / ISR routes.
 *
 * Because it never touches cookies(), pages and route handlers that use it stay
 * statically renderable (ISR via the Cloudflare KV incremental cache) instead of
 * being forced dynamic. It can only read what the anon role is allowed to see
 * under RLS (e.g. published knowledge articles). Do NOT use it for per-user data.
 */
export function getSupabaseStatic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase static client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
