import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const role = await getUserRole();
    const { data: rows, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user?.id ?? '');
    return NextResponse.json({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      role,
      rows,
      query_error: error?.message ?? null,
    });
  } catch (e) {
    return NextResponse.json({ caught: String(e) }, { status: 500 });
  }
}
