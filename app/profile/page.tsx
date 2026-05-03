import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProfileOverview } from '@/lib/profile-data';
import { SkillRadar } from './skill-radar';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const HIRE_LABEL: Record<string, string> = {
  hire: 'Hire',
  leaning_hire: 'Leaning hire',
  leaning_no_hire: 'Leaning no hire',
  no_hire: 'No hire',
};

export default async function OverviewPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { totals, recent, radar, profile } = await getProfileOverview(user.id);

  const hasInterviews = totals.total_interviews > 0;
  const hasRadarData = radar.some((r) => r.score !== null);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard label="Interviews" value={totals.total_interviews} hint={`${totals.completed_interviews} completed`} />
        <StatCard label="Avg score" value={totals.avg_score !== null ? totals.avg_score.toFixed(1) : '\u2014'} hint="across completed runs" />
        <StatCard label="Best grade" value={totals.best_grade ?? '\u2014'} hint="highest letter awarded" />
        <StatCard label="Streak" value={totals.streak_days} hint={totals.streak_days === 1 ? 'consecutive day' : 'consecutive days'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        <div className="border border-[#f5efe2]/10 rounded-sm p-7 bg-[#0e1c33]/50">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[11px] tracking-[0.22em] text-[#d4a04a]">- SKILL RADAR</div>
            <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/45">7 AXES</span>
          </div>
          <h2 className="font-serif text-2xl mb-6">Where you stand by phase.</h2>
          {hasRadarData ? (
            <SkillRadar data={radar} />
          ) : (
            <EmptyBlock title="No phase data yet" body="Finish a few interviews and we'll plot your strongest and weakest phases here." />
          )}
        </div>

        <div className="border border-[#f5efe2]/10 rounded-sm p-7 bg-[#0e1c33]/50">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[11px] tracking-[0.22em] text-[#d4a04a]">- RECENT SESSIONS</div>
            <Link href="/profile/history" className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55 hover:text-[#d4a04a] transition-colors">SEE ALL \u2197</Link>
          </div>
          <h2 className="font-serif text-2xl mb-6">Last 3 runs.</h2>
          {recent.length > 0 ? (
            <ul className="space-y-3">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 border border-[#f5efe2]/10 px-4 py-3 rounded-sm">
                  <div className="min-w-0">
                    <div className="font-serif text-lg capitalize">{r.candidate_level}</div>
                    <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">{fmtDate(r.started_at)} \u00b7 {(r.input_mode ?? 'text').toUpperCase()}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {r.status === 'completed' ? (
                      <>
                        <div className="font-serif text-2xl text-[#d4a04a]">{r.letter_grade ?? '\u2014'}</div>
                        <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">{r.hire_recommendation ? (HIRE_LABEL[r.hire_recommendation] ?? r.hire_recommendation) : ''}</div>
                      </>
                    ) : (
                      <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">{r.status.toUpperCase()}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock title="No sessions yet" body="Your first interview is one click away." cta={{ href: '/interview/setup', label: 'Start now \u2192' }} />
          )}
        </div>
      </div>

      {!profile?.first_name && (
        <div className="border border-[#d4a04a]/40 rounded-sm p-7 bg-[#d4a04a]/5">
          <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-2">- FINISH YOUR PROFILE</div>
          <h2 className="font-serif text-2xl mb-2">Tell the interviewer who's in the room.</h2>
          <p className="text-sm text-[#f5efe2]/70 max-w-xl mb-5">Add your name, school, and a short CV summary. The persona uses these to ask sharper, more personal follow-ups.</p>
          <Link href="/profile/about" className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-7 py-3 rounded-sm hover:bg-[#c8923a] transition-colors">Complete profile \u2192</Link>
        </div>
      )}

      {!hasInterviews && (
        <EmptyHero />
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-[#f5efe2]/10 rounded-sm p-5 bg-[#0e1c33]/50">
      <div className="text-[10px] tracking-[0.22em] text-[#f5efe2]/55">{label.toUpperCase()}</div>
      <div className="font-serif text-3xl mt-2">{value}</div>
      {hint && <div className="text-[11px] tracking-[0.05em] text-[#f5efe2]/45 mt-1">{hint}</div>}
    </div>
  );
}

function EmptyBlock({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="text-center py-10">
      <div className="font-serif text-xl mb-2">{title}</div>
      <p className="text-sm text-[#f5efe2]/60 max-w-md mx-auto mb-4">{body}</p>
      {cta && (
        <Link href={cta.href} className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-6 py-2.5 rounded-sm hover:bg-[#c8923a] transition-colors">{cta.label}</Link>
      )}
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="border border-dashed border-[#f5efe2]/20 rounded-sm p-12 text-center">
      <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-3">- NEW HERE</div>
      <h2 className="font-serif text-3xl mb-3">Step into your first room.</h2>
      <p className="text-sm text-[#f5efe2]/65 max-w-md mx-auto mb-6">Pick a level, choose how you'll answer, and meet the interviewer. We'll start tracking your skill radar from session one.</p>
      <Link href="/interview/setup" className="inline-block bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-8 py-3.5 rounded-sm hover:bg-[#c8923a] transition-colors">Start interview \u2192</Link>
    </div>
  );
}
