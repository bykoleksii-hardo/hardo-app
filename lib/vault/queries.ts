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

export type VaultFeedback = {
  stepId: number;
  interviewId: string;
  kind: 'standard' | 'deep_dive';
  grade: string | null;
  scoreNumeric: number | null;
  feedback: string | null;
  answer: string | null;
  createdAt: string | null;
};

export type VaultQuestionDetail = {
  id: number;
  category: string;
  subtopic: string | null;
  difficulty: number | null;
  candidate_level: string | null;
  question: string;
  unlocked: boolean;
  bestGrade: string | null;
  attempts: number;
  deepDiveCount: number;
  avgScore: number | null;
  feedback: VaultFeedback[];
};

// Loads a single question for the Vault detail page: the question itself, whether
// the user has unlocked it, their best block grade, light stats, and the full
// history of feedback they have received answering it (across standard interviews
// and deep dives). RLS scopes interview_steps to the current user's interviews.
export async function getQuestionDetail(
  userId: string,
  questionId: number,
): Promise<VaultQuestionDetail | null> {
  const supabase = await getSupabaseServer();

  const [{ data: questionRaw }, { data: exposure }, { data: stepsRaw }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, category, subtopic, difficulty, candidate_level, question')
      .eq('id', questionId)
      .is('parent_id', null)
      .maybeSingle(),
    supabase
      .from('question_exposure')
      .select('question_id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle(),
    // Base steps (block roots) for this question that have been graded. RLS already
    // scopes this to the current user's own interviews; we join the interview kind.
    supabase
      .from('interview_steps')
      .select('id, interview_id, ai_grade, score_numeric, ai_feedback, user_answer, created_at, interviews ( kind )')
      .eq('question_id', questionId)
      .eq('is_follow_up', false)
      .not('ai_grade', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  if (!questionRaw) return null;
  const q = questionRaw as {
    id: number;
    category: string;
    subtopic: string | null;
    difficulty: number | null;
    candidate_level: string | null;
    question: string;
  };

  type StepRow = {
    id: number;
    interview_id: string;
    ai_grade: string | null;
    score_numeric: number | null;
    ai_feedback: string | null;
    user_answer: string | null;
    created_at: string | null;
    interviews: { kind: string | null } | { kind: string | null }[] | null;
  };

  const steps = (stepsRaw ?? []) as StepRow[];

  const feedback: VaultFeedback[] = steps.map((s) => {
    const iv = Array.isArray(s.interviews) ? s.interviews[0] : s.interviews;
    const kind = iv?.kind === 'deep_dive' ? 'deep_dive' : 'standard';
    return {
      stepId: s.id,
      interviewId: s.interview_id,
      kind,
      grade: s.ai_grade,
      scoreNumeric: typeof s.score_numeric === 'number' ? s.score_numeric : null,
      feedback: s.ai_feedback,
      answer: s.user_answer,
      createdAt: s.created_at,
    };
  });

  let bestGrade: string | null = null;
  let scoreSum = 0;
  let scoreCount = 0;
  let deepDiveCount = 0;
  for (const f of feedback) {
    bestGrade = bestOf(bestGrade, f.grade);
    if (typeof f.scoreNumeric === 'number') {
      scoreSum += f.scoreNumeric;
      scoreCount += 1;
    }
    if (f.kind === 'deep_dive') deepDiveCount += 1;
  }

  return {
    id: q.id,
    category: q.category,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    candidate_level: q.candidate_level,
    question: q.question,
    unlocked: Boolean(exposure),
    bestGrade,
    attempts: feedback.length,
    deepDiveCount,
    avgScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null,
    feedback,
  };
}
