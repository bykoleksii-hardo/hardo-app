import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type UserRole = 'user' | 'editor' | 'admin';

export async function getUserRole(): Promise<UserRole> {
  // Identify the caller via their session (RLS-aware client).
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';

  // Read role via the service-role client. This deliberately bypasses RLS
  // on user_roles so that an RLS misconfiguration (see 0005_fix_user_roles_recursion)
  // can never silently elevate or revoke privileges.
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return 'user';
  return (data.role as UserRole) ?? 'user';
}

export function isStaff(role: UserRole): boolean {
  return role === 'admin' || role === 'editor';
}
