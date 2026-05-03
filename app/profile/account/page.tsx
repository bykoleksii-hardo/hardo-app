import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Quota / plan from existing /api/quota route
  const { data: row } = await supabase
    .from('users')
    .select('candidate_level')
    .eq('id', user.id)
    .maybeSingle();

  // crude plan detection - real source is /api/quota
  // Account page just shows user identity; plan management uses link to upgrade or cancel flow later
  return (
    <div className="space-y-10 max-w-3xl">
      {/* SIGN-IN */}
      <Section title="SIGN-IN" subtitle="The account this profile belongs to.">
        <div className="border border-[#f5efe2]/10 rounded-sm p-5">
          <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">EMAIL</div>
          <div className="font-serif text-lg mt-1">{user.email}</div>
          <div className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45 mt-2">Signed in via Supabase auth</div>
        </div>
      </Section>

      {/* PLAN */}
      <Section title="PLAN" subtitle="Free includes one Intern interview. Hardo unlocks Analyst, Associate, and unlimited runs.">
        <div className="border border-[#f5efe2]/10 rounded-sm p-5 flex items-center justify-between gap-6">
          <div>
            <div className="font-serif text-xl">Free</div>
            <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55 mt-1">1 INTERN INTERVIEW INCLUDED</div>
          </div>
          <Link href="/upgrade" className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-6 py-3 rounded-sm hover:bg-[#c8923a] transition-colors">
            Upgrade to Hardo →
          </Link>
        </div>
        <p className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45">$12 / month, monthly only. Cancel anytime from this page once you're on a paid plan.</p>
      </Section>

      {/* DEFAULTS */}
      <Section title="DEFAULTS" subtitle="Your last picks come back next time you start a new interview.">
        <div className="border border-[#f5efe2]/10 rounded-sm p-5">
          <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">DEFAULT LEVEL</div>
          <div className="font-serif text-lg mt-1 capitalize">{row?.candidate_level ?? 'Intern'}</div>
          <div className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45 mt-2">Auto-set from your most recent interview.</div>
        </div>
      </Section>

      {/* SIGN-OUT */}
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
