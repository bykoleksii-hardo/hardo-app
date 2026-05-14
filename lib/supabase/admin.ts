import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service_role key.
 * NEVER import this from a client component or expose its result over the network.
 * Use only inside API routes or server actions that have already authorised the caller
 * (e.g. via getUserRole()).
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
