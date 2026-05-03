import { getSupabaseServer } from '@/lib/supabase/server';

export type UserRole = 'user' | 'editor' | 'admin';

export async function getUserRole(): Promise<UserRole> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';
  const { data, error } = await supabase
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
