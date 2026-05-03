import { getSupabaseServer } from '@/lib/supabase/server';

export type Plan = 'anon' | 'free' | 'paid';

export type QuotaStatus = {
  plan: Plan;
  interviews_used: number;
  interviews_remaining: number | null;
  is_paid: boolean;
};

export async function getViewerPlan(): Promise<QuotaStatus> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { plan: 'anon', interviews_used: 0, interviews_remaining: null, is_paid: false };
  }
  try {
    const { data, error } = await supabase.rpc('get_user_quota_status');
    if (error || !data) {
      return { plan: 'free', interviews_used: 0, interviews_remaining: 1, is_paid: false };
    }
    const row: any = Array.isArray(data) ? data[0] : data;
    const isPaid: boolean =
      row?.is_paid === true ||
      row?.plan === 'hardo' ||
      row?.plan === 'paid' ||
      row?.subscription_status === 'active';
    return {
      plan: isPaid ? 'paid' : 'free',
      interviews_used: Number(row?.interviews_used ?? 0),
      interviews_remaining: isPaid
        ? null
        : Number(row?.interviews_remaining ?? Math.max(0, 1 - Number(row?.interviews_used ?? 0))),
      is_paid: isPaid,
    };
  } catch {
    return { plan: 'free', interviews_used: 0, interviews_remaining: 1, is_paid: false };
  }
}
