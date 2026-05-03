import { getSupabaseServer } from '@/lib/supabase/server';
import type {
  UserProfile,
  InterviewHistoryItem,
} from '@/lib/types';

function scoreToLetter(score: number | null): string | null {
  if (score == null) return null;
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D';
  return 'F';
}


const SKILL_AXES: Array<{ key: string; label: string; phases: string[] }> = [
  { key: 'accounting', label: 'Accounting', phases: ['Accounting'] },
  { key: 'valuation', label: 'Valuation', phases: ['Valuation'] },
  { key: 'corp_finance', label: 'Corp Finance', phases: ['Corporate Finance'] },
  { key: 'case_study', label: 'Case / M&A', phases: ['Case Study', 'M&A'] },
  { key: 'pe_lbo', label: 'PE / LBO', phases: ['Private Equity / LBO', 'Private Equity', 'LBO'] },
  { key: 'behavioral', label: 'Behavioral', phases: ['Behavioral / Fit', 'Behavioral'] },
  { key: 'markets', label: 'Markets', phases: ['Business Acumen / Markets', 'Markets'] },
];

export interface ProfileOverview {
  profile: UserProfile | null;
  totals: {
    total_interviews: number;
    completed_interviews: number;
    avg_score: number | null;
    best_grade: string | null;
    streak_days: number;
  };
  recent: InterviewHistoryItem[];
  radar: Array<{ key: string; label: string; score: number | null; sample_size: number }>;
}

const GRADE_RANK: Record<string, number> = {
  'A+': 12, 'A': 11, 'A-': 10,
  'B+': 9, 'B': 8, 'B-': 7,
  'C+': 6, 'C': 5, 'C-': 4,
  'D+': 3, 'D': 2, 'D-': 1, 'F': 0,
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return (data as UserProfile) ?? null;
}

export async function getProfileOverview(userId: string): Promise<ProfileOverview> {
  const supabase = await getSupabaseServer();

  const [{ data: profile }, { data: interviews }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('interviews')
      .select('id, candidate_level, input_mode, status, started_at, finished_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),
  ]);

  const interviewRows = (interviews ?? []) as Array<{
    id: string;
    candidate_level: string;
    input_mode: string | null;
    status: string;
    started_at: string;
    finished_at: string | null;
  }>;

  const completedIds = interviewRows.filter((r) => r.status === 'completed').map((r) => r.id);

  let summaries: Array<{ interview_id: string; overall_score: number | null; hire_recommendation: string | null }> = [];
  let grades: Array<{ interview_id: string; letter_grade: string | null }> = [];
  let stepGrades: Array<{ interview_id: string; phase: string; ai_grade: string | null }> = [];

  if (completedIds.length > 0) {
    const [{ data: s }, gradePromises, { data: steps }] = await Promise.all([
      supabase
        .from('interview_summaries')
        .select('interview_id, overall_score, hire_recommendation')
        .in('interview_id', completedIds),
      Promise.resolve([]),
      supabase
        .from('interview_steps').select('interview_id, ai_grade, questions(category)')
        .in('interview_id', completedIds),
    ]);
    summaries = (s ?? []) as typeof summaries;
    grades = (s ?? []).map((row: any) => ({ interview_id: row.interview_id, letter_grade: scoreToLetter(row.overall_score) }));
    stepGrades = (steps ?? []) as typeof stepGrades;
  }

  const summaryMap = new Map(summaries.map((s) => [s.interview_id, s]));
  const gradeMap = new Map(grades.map((g) => [g.interview_id, g.letter_grade]));

  const history: InterviewHistoryItem[] = interviewRows.map((r) => ({
    id: r.id,
    candidate_level: (r.candidate_level as any) ?? 'intern',
    input_mode: r.input_mode,
    status: (r.status as any) ?? 'pending',
    started_at: r.started_at,
    finished_at: r.finished_at,
    overall_score: summaryMap.get(r.id)?.overall_score ?? null,
    hire_recommendation: (summaryMap.get(r.id)?.hire_recommendation as any) ?? null,
    letter_grade: gradeMap.get(r.id) ?? null,
  }));

  const recent = history.slice(0, 3);

  const scores = summaries
    .map((s) => s.overall_score)
    .filter((v): v is number => typeof v === 'number');
  const avg_score = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

  let best_grade: string | null = null;
  let bestRank = -1;
  for (const sm of summaries) {
    const lg = scoreToLetter(sm.overall_score);
    if (!lg) continue;
    const rank = GRADE_RANK[lg] ?? -1;
    if (rank > bestRank) { bestRank = rank; best_grade = lg; }
  }

  // streak: consecutive days ending today with at least one started interview
  const dayStrings = new Set(
    interviewRows.map((r) => new Date(r.started_at).toISOString().slice(0, 10)),
  );
  let streak_days = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dayStrings.has(key)) streak_days++;
    else if (i === 0) continue; // allow empty today
    else break;
  }

  // radar: average ai_grade rank per phase, normalized to 0-10
  const radar = SKILL_AXES.map(({ key, label, phases }) => {
    const matching = stepGrades.filter((s) => phases.includes((s as any).questions?.category) && s.ai_grade);
    if (matching.length === 0) return { key, label, score: null as number | null, sample_size: 0 };
    const ranks = matching
      .map((s) => GRADE_RANK[s.ai_grade!] ?? null)
      .filter((v): v is number => v !== null);
    if (ranks.length === 0) return { key, label, score: null, sample_size: 0 };
    const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    // map 0..12 -> 0..10
    const score = +((avg / 12) * 10).toFixed(1);
    return { key, label, score, sample_size: ranks.length };
  });

  return {
    profile: (profile as UserProfile) ?? null,
    totals: {
      total_interviews: interviewRows.length,
      completed_interviews: completedIds.length,
      avg_score,
      best_grade,
      streak_days,
    },
    recent,
    radar,
  };
}

export async function getProfileHistory(userId: string): Promise<InterviewHistoryItem[]> {
  const overview = await getProfileOverview(userId);
  // overview already builds history with grades; just rebuild full list
  const supabase = await getSupabaseServer();
  const { data: interviews } = await supabase
    .from('interviews')
    .select('id, candidate_level, input_mode, status, started_at, finished_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  const rows = (interviews ?? []) as Array<{
    id: string;
    candidate_level: string;
    input_mode: string | null;
    status: string;
    started_at: string;
    finished_at: string | null;
  }>;
  const completedIds = rows.filter((r) => r.status === 'completed').map((r) => r.id);
  let summaries: Array<{ interview_id: string; overall_score: number | null; hire_recommendation: string | null }> = [];
  let grades: Array<{ interview_id: string; letter_grade: string | null }> = [];
  if (completedIds.length > 0) {
    const [{ data: s }, gp] = await Promise.all([
      supabase
        .from('interview_summaries')
        .select('interview_id, overall_score, hire_recommendation')
        .in('interview_id', completedIds),
      Promise.resolve([] as Array<{ interview_id: string; letter_grade: string | null }>),
    ]);
    summaries = (s ?? []) as typeof summaries;
    grades = (s ?? []).map((row: any) => ({ interview_id: row.interview_id, letter_grade: scoreToLetter(row.overall_score) }));
  }
  const summaryMap = new Map(summaries.map((s) => [s.interview_id, s]));
  const gradeMap = new Map(grades.map((g) => [g.interview_id, g.letter_grade]));

  return rows.map((r) => ({
    id: r.id,
    candidate_level: (r.candidate_level as any) ?? 'intern',
    input_mode: r.input_mode,
    status: (r.status as any) ?? 'pending',
    started_at: r.started_at,
    finished_at: r.finished_at,
    overall_score: summaryMap.get(r.id)?.overall_score ?? null,
    hire_recommendation: (summaryMap.get(r.id)?.hire_recommendation as any) ?? null,
    letter_grade: gradeMap.get(r.id) ?? null,
  }));
}
