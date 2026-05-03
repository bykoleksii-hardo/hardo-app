import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getProfileHistory } from '@/lib/profile-data';

export const dynamic = 'force-dynamic';

const HIRE_LABEL: Record<string, string> = {
  hire: 'Hire',
  leaning_hire: 'Leaning hire',
  leaning_no_hire: 'Leaning no hire',
  no_hire: 'No hire',
};

const HIRE_COLOR: Record<string, string> = {
  hire: 'text-[#9ed490]',
  leaning_hire: 'text-[#B88736]',
  leaning_no_hire: 'text-[#e8a062]',
  no_hire: 'text-[#e89292]',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDur(startIso: string, endIso: string | null) {
  if (!endIso) return '—';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms <= 0) return '—';
  const min = Math.round(ms / 60000);
  return `${min}m`;
}

export default async function HistoryPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const history = await getProfileHistory(user.id);

  if (history.length === 0) {
    return (
      <div className="border border-dashed border-[#11161E]/20 rounded-sm p-16 text-center">
        <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-3">- NO HISTORY YET</div>
        <h2 className="font-serif text-3xl mb-3">Every run lands here.</h2>
        <p className="text-sm text-[#11161E]/65 max-w-md mx-auto mb-6">After each interview you'll see the level, your grade, and the interviewer's read - all in one place.</p>
        <Link href="/interview/setup" className="inline-block bg-[#B88736] text-[#FBF7EE] font-medium tracking-[0.05em] px-8 py-3.5 rounded-sm hover:bg-[#9C6F1E] transition-colors">Start your first interview →</Link>
      </div>
    );
  }

  const completed = history.filter((h) => h.status === 'completed');
  const inFlight = history.filter((h) => h.status === 'active' || h.status === 'pending');

  return (
    <div className="space-y-12">
      {inFlight.length > 0 && (
        <section>
          <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-4">- IN PROGRESS</div>
          <ul className="space-y-3">
            {inFlight.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-6 border border-[#B88736]/40 rounded-sm px-6 py-4 bg-[#F2ECDF]/40">
                <div>
                  <div className="font-serif text-xl capitalize">{h.candidate_level}</div>
                  <div className="text-[11px] tracking-[0.18em] text-[#11161E]/55">Started {fmtDate(h.started_at)} · {(h.input_mode ?? 'text').toUpperCase()}</div>
                </div>
                <Link href={`/interview/${h.id}`} className="text-[11px] tracking-[0.18em] text-[#B88736] hover:text-[#11161E] transition-colors">RESUME ↗</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-4">- COMPLETED</div>
        <div className="overflow-hidden border border-[#11161E]/10 rounded-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#F2ECDF] text-[10px] tracking-[0.22em] text-[#11161E]/55">
              <tr>
                <th className="text-left px-5 py-4">DATE</th>
                <th className="text-left px-5 py-4">LEVEL</th>
                <th className="text-left px-5 py-4">MODE</th>
                <th className="text-left px-5 py-4">DURATION</th>
                <th className="text-left px-5 py-4">SCORE</th>
                <th className="text-left px-5 py-4">GRADE</th>
                <th className="text-left px-5 py-4">VERDICT</th>
                <th className="text-right px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {completed.map((h) => (
                <tr key={h.id} className="border-t border-[#11161E]/10 hover:bg-[#F2ECDF]/40">
                  <td className="px-5 py-4 text-[#11161E]/85">{fmtDate(h.started_at)}</td>
                  <td className="px-5 py-4 capitalize">{h.candidate_level}</td>
                  <td className="px-5 py-4 text-[#11161E]/65">{(h.input_mode ?? 'text').toUpperCase()}</td>
                  <td className="px-5 py-4 text-[#11161E]/65">{fmtDur(h.started_at, h.finished_at)}</td>
                  <td className="px-5 py-4">{h.overall_score !== null ? h.overall_score.toFixed(1) : '—'}</td>
                  <td className="px-5 py-4 font-serif text-lg text-[#B88736]">{h.letter_grade ?? '—'}</td>
                  <td className={`px-5 py-4 text-[11px] tracking-[0.18em] ${h.hire_recommendation ? (HIRE_COLOR[h.hire_recommendation] ?? '') : 'text-[#11161E]/55'}`}>
                    {h.hire_recommendation ? (HIRE_LABEL[h.hire_recommendation] ?? h.hire_recommendation).toUpperCase() : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/interview/${h.id}/summary`} className="text-[11px] tracking-[0.18em] text-[#B88736] hover:text-[#11161E] transition-colors">VIEW ↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
