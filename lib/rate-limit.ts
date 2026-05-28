import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/observability';

export type RateLimitConfig = {
  /** Identifier for this bucket (e.g. route name). Combined with the subject key. */
  bucket: string;
  /** Max requests per window. */
  capacity: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
};

/**
 * Best-effort rate limiter backed by Postgres (public.rate_limit_take RPC).
 * Fails OPEN on infrastructure errors — we never block real users because
 * the limiter itself is broken. All failures are logged.
 */
export async function rateLimitTake(
  subjectKey: string,
  cfg: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const admin = getSupabaseAdmin();
    const key = `${cfg.bucket}:${subjectKey}`;
    const { data, error } = await admin.rpc('rate_limit_take', {
      p_key: key,
      p_capacity: cfg.capacity,
      p_window_seconds: cfg.windowSeconds,
    });
    if (error) {
      logger.warn('rate_limit_rpc_error', { bucket: cfg.bucket, message: error.message });
      return { allowed: true, remaining: cfg.capacity, resetAt: null };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { allowed: true, remaining: cfg.capacity, resetAt: null };
    return {
      allowed: !!row.allowed,
      remaining: typeof row.remaining === 'number' ? row.remaining : 0,
      resetAt: row.reset_at ? new Date(row.reset_at) : null,
    };
  } catch (e) {
    logger.warn('rate_limit_exception', { bucket: cfg.bucket, error: (e as Error).message });
    return { allowed: true, remaining: cfg.capacity, resetAt: null };
  }
}

/** Best-effort subject derivation: prefer userId, fall back to IP, fall back to 'anon'. */
export function rateLimitSubject(opts: { userId?: string | null; req?: Request }): string {
  if (opts.userId) return `u:${opts.userId}`;
  if (opts.req) {
    const ip =
      opts.req.headers.get('cf-connecting-ip') ||
      opts.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      opts.req.headers.get('x-real-ip');
    if (ip) return `ip:${ip}`;
  }
  return 'anon';
}

export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining),
  };
  if (result.resetAt) {
    headers['X-RateLimit-Reset'] = result.resetAt.toISOString();
    const retryAfterSec = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
    headers['Retry-After'] = String(retryAfterSec);
  }
  return NextResponse.json(
    { error: 'rate_limited', message: 'Too many requests. Try again shortly.' },
    { status: 429, headers }
  );
}
