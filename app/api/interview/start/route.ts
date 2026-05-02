import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { level } = await req.json();
    if (!['intern', 'analyst', 'associate'].includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // --- Gating ---
    const { data: quota, error: quotaErr } = await supabase.rpc('get_user_quota_status');
    if (quotaErr) {
      console.error('get_user_quota_status error', quotaErr);
      return NextResponse.json({ error: 'Quota check failed' }, { status: 500 });
    }
    const q = quota as {
      plan: 'free' | 'paid';
      interviews_used: number;
      free_limit: number;
      allowed_levels: string[];
      can_start: boolean;
    };
    if (!q.allowed_levels.includes(level)) {
      return NextResponse.json(
        { error: 'This level is available on the paid plan only.', reason: 'level_locked', plan: q.plan },
        { status: 403 }
      );
    }
    if (!q.can_start) {
      return NextResponse.json(
        {
          error: 'You have used your free interview. Upgrade to continue.',
          reason: 'free_limit_reached',
          plan: q.plan,
          interviews_used: q.interviews_used,
          free_limit: q.free_limit,
        },
        { status: 403 }
      );
    }
    // --- End gating ---

    const { data, error } = await supabase.rpc('start_interview', { p_level: level });
    if (error) {
      console.error('start_interview RPC error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ interview_id: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
