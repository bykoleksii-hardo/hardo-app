import { getSupabaseServer } from '@/lib/supabase/server';

export type Region = 'US' | 'EMEA' | 'Global';
export const REGIONS: Region[] = ['US', 'EMEA', 'Global'];

export type AdminQuestion = {
  id: number;
  question: string;
  category: string;
  subtopic: string | null;
  difficulty: number | null;
  region: Region;
};

export async function listAllQuestions(): Promise<AdminQuestion[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('questions')
    .select('id, question, category, subtopic, difficulty, region')
    .order('category', { ascending: true })
    .order('difficulty', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (error || !data) return [];
  return data as AdminQuestion[];
}

export async function getQuestionById(id: number): Promise<AdminQuestion | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('questions')
    .select('id, question, category, subtopic, difficulty, region')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as AdminQuestion;
}

// Per-question answer key (key_points + model_answer). Separate from the core
// reads above so the rest of admin keeps working whether or not the 2026_18
// columns exist yet.
export type QuestionAnswerKey = { key_points: string[] | null; model_answer: string | null };

export async function getQuestionAnswerKey(id: number): Promise<QuestionAnswerKey | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('questions')
    .select('key_points, model_answer')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const raw = data as { key_points?: unknown; model_answer?: unknown };
  const kp = Array.isArray(raw.key_points) ? raw.key_points.filter((s): s is string => typeof s === 'string') : null;
  return { key_points: kp && kp.length ? kp : null, model_answer: typeof raw.model_answer === 'string' ? raw.model_answer : null };
}

export async function updateQuestionAnswerKey(id: number, key: QuestionAnswerKey): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from('questions')
    .update({ key_points: key.key_points, model_answer: key.model_answer })
    .eq('id', id);
  return !error;
}
