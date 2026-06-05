import { getSupabaseServer } from '@/lib/supabase/server';

export type VaultQuestion = {
  id: number;
  category: string;
  subtopic: string | null;
  difficulty: number | null;
  candidate_level: string | null;
  question: string;
  unlocked: boolean;
  bestGrade: string | null;
};

export type VaultData = {
  questions: VaultQuestion[];
  categories: string[];
  totalCount: number;
  unlockedCount: number;
};

// Letter-grade ranking, mirrors lib/profile-data.ts so "best grade" is comparable.
const GRADE_RANK: Record<string, number> = {
  'A+': 12, A: 11, 'A-': 10,
  'B+': 9, B: 8, 'B-': 7,
  'C+': 6, C: 5, 'C-': 4,
  'D+': 3, D: 2, 'D-': 1, F: 0,
};

function bestOf(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return (GRADE_RANK[b] ?? -1) > (GRADE_RANK[a] ?? -1) ? b : a;
}

// Loads the full Question Vault for a user: every base question (parent_id is null),
// flagged unlocked when the user has encountered it (question_exposure), with the
// best block grade they have achieved on it across all interviews.
export async function getVaultData(userId: string): Promise<VaultData> {
  const supabase = await getSupabaseServer();

  const [{ data: questionsRaw }, { data: exposureRaw }, { data: gradedRaw }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, category, subtopic, difficulty, candidate_level, question')
      .is('parent_id', null)
      .order('category', { ascending: true })
      .order('difficulty', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true }),
    supabase
      .from('question_exposure')
      .select('question_id')
      .eq('user_id', userId),
    // Base steps (block roots) that carry a letter grade. RLS (interview_steps_self_all)
    // already scopes this to the current user's own interviews.
    supabase
      .from('interview_steps')
      .select('question_id, ai_grade')
      .eq('is_follow_up', false)
      .not('ai_grade', 'is', null),
  ]);

  const unlocked = new Set<number>(
    ((exposureRaw ?? []) as Array<{ question_id: number | null }>)
      .map((r) => r.question_id)
      .filter((id): id is number => typeof id === 'number'),
  );

  const bestByQuestion = new Map<number, string | null>();
  for (const row of (gradedRaw ?? []) as Array<{ question_id: number | null; ai_grade: string | null }>) {
    if (typeof row.question_id !== 'number') continue;
    bestByQuestion.set(row.question_id, bestOf(bestByQuestion.get(row.question_id) ?? null, row.ai_grade));
  }

  const questions: VaultQuestion[] = ((questionsRaw ?? []) as Array<{
    id: number;
    category: string;
    subtopic: string | null;
    difficulty: number | null;
    candidate_level: string | null;
    question: string;
  }>).map((q) => ({
    id: q.id,
    category: q.category,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    candidate_level: q.candidate_level,
    question: q.question,
    unlocked: unlocked.has(q.id),
    bestGrade: bestByQuestion.get(q.id) ?? null,
  }));

  const categories = Array.from(new Set(questions.map((q) => q.category))).sort();
  const unlockedCount = questions.reduce((n, q) => n + (q.unlocked ? 1 : 0), 0);

  return {
    questions,
    categories,
    totalCount: questions.length,
    unlockedCount,
  };
}
