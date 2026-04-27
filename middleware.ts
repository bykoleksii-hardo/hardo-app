// Auth check is handled inside each protected page via getSupabaseServer().auth.getUser().
// We intentionally keep this matcher empty so middleware never runs - avoids edge-runtime
// incompatibility with @supabase/ssr in OpenNext on Cloudflare.
import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
