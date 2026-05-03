import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';

export const dynamic = 'force-dynamic';

interface Quota {
  plan: 'free' | 'paid';
  interviews_used: number;
  free_limit: number;
  allowed_levels: string[];
  can_start: boolean;
}

export default async function AccountPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: row }, { data: quotaData }] = await Promise.all([
    supabase.from('users').select('candidate_level').eq('id', user.id).maybeSingle(),
    supabase.rpc('get_user_quota_status'),
  ]);

  const quota = (quotaData as Quota | null) ?? null;
  const isPaid = quota?.plan === 'paid';
  const freeLeft = quota ? Math.max(0, quota.free_limit - quota.interviews_used) : 1;

  return (
    <div className="space-y-10 max-w-3xl">
      <Section title="SIGN-IN" subtitle="The account this profile belongs to.">
        <div className="border border-[#f5efe2]/10 rounded-sm p-5">
          <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">EMAIL</div>
          <div className="font-serif text-lg mt-1">{user.email}</div>
          <div className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45 mt-2">Signed in via Supabase auth</div>
        </div>
      </Section>

      <Section
        title="PLAN"
        subtitle={
          isPaid
            ? "You're on Hardo. Unlimited Intern, Analyst, and Associate runs."
            : 'Free includes one Intern interview. Hardo unlocks Analyst, Associate, and unlimited runs.'
        }
      >
        <div className="border border-[#f5efe2]/10 rounded-sm p-5 flex items-center justify-between gap-6">
          <div>
            <div className="font-serif text-xl flex items-center gap-3">
              {isPaid ? 'Hardo' : 'Free'}
              {isPaid && (
                <span className="text-[10px] tracking-[0.22em] text-[#d4a04a] border border-[#d4a04a]/60 px-2 py-0.5">PAID</span>
              )}
            </div>
            <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55 mt-1">
              {isPaid
                ? 'UNLIMITED INTERVIEWS · ALL LEVELS'
                : `${freeLeft}/${quota?.free_limit ?? 1} INTERN INTERVIEW${(quota?.free_limit ?? 1) === 1 ? '' : 'S'} LEFT`}
            </div>
          </div>
          {isPaid ? (
            <button type="button" disabled className="border border-[#f5efe2]/20 text-[#f5efe2]/50 tracking-[0.05em] px-6 py-3 rounded-sm cursor-not-allowed" title="Plan management coming soon">
              Manage plan
            </button>
          ) : (
            <Link href="/upgrade" className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-6 py-3 rounded-sm hover:bg-[#c8923a] transition-colors">
              Upgrade to Hardo →
            </Link>
          )}
        </div>
        <p className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45">
          {isPaid
            ? 'Cancel anytime — billing portal is coming. Reach out if you need it now.'
            : '$12 / month, monthly only. Cancel anytime once you upgrade.'}
        </p>
      </Section>

      <Section title="DEFAULTS" subtitle="Your last picks come back next time you start a new interview.">
        <div className="border border-[#f5efe2]/10 rounded-sm p-5">
          <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">DEFAULT LEVEL</div>
          <div className="font-serif text-lg mt-1 capitalize">{row?.candidate_level ?? 'Intern'}</div>
          <div className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45 mt-2">Auto-set from your most recent interview.</div>
        </div>
      </Section>

      <Section title="SESSION" subtitle="Sign out of this browser.">
        <SignOutButton />
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <div className="text-[11px] tracking-[0.22em] text-[#d4a04a]">- {title}</div>
        {subtitle && <p className="text-sm text-[#f5efe2]/60 mt-1 max-w-xl">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
