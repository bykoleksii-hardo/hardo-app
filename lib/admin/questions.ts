import { getSupabaseServer } from '@/lib/supabase/server';

export type AdminQuestion = {
  id: number;
  question: string;
  category: string;
  subtopic: string | null;
  difficulty: number | null;
};

export async function listAllQuestions(): Promise<AdminQuestion[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('questions')
    .select('id, question, category, subtopic, difficulty')
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
    .select('id, question, category, subtopic, difficulty')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as AdminQuestion;
}
