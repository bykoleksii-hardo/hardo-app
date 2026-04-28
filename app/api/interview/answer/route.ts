import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type StepRowForWebhook = {
    id: string;
    interview_id: string;
    is_follow_up: boolean;
    parent_step_id: string | null;
    custom_question: string | null;
    questions: { id: number; question: string; category: string; subtopic: string | null; difficulty: number } | null;
    interviews: { candidate_level: string } | null;
};

async function fireEvaluationWebhook(payload: Record<string, unknown>) {
    const url = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.HARDO_WEBHOOK_SECRET;
    if (!url || !secret) {
          console.warn('[ai] N8N_WEBHOOK_URL or HARDO_WEBHOOK_SECRET not set, skipping');
          return;
    }
    try {
          await fetch(url, {
                  method: 'POST',
                  headers: {
                            'Content-Type': 'application/json',
                            'X-Hardo-Secret': secret,
                  },
                  body: JSON.stringify(payload),
          });
    } catch (e) {
          console.error('[ai] webhook error', e);
    }
}

export async function POST(req: Request) {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { stepId?: string; answer?: string } | null;
    if (!body?.stepId || typeof body.answer !== 'string') {
          return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    if (body.answer.trim().length < 2) {
          return NextResponse.json({ error: 'answer too short' }, { status: 400 });
    }

  // 1. Save the answer via existing RPC (writes user_answer + answered_at)
  const { data, error } = await supabase.rpc('submit_answer', {
        p_step_id: body.stepId,
        p_answer: body.answer.trim(),
  });
    if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
    }

  // 2. Mark this step as evaluating (so the client shows the spinner via realtime)
  await supabase
      .from('interview_steps')
      .update({ ai_status: 'evaluating' })
      .eq('id', body.stepId);

  // 3. Load the step + question + interview level for the AI prompt
  const { data: stepRow } = await supabase
      .from('interview_steps')
      .select('id, interview_id, is_follow_up, parent_step_id, custom_question, questions(id, question, category, subtopic, difficulty), interviews(candidate_level)')
      .eq('id', body.stepId)
      .maybeSingle() as unknown as { data: StepRowForWebhook | null };

  if (stepRow) {
        // Fire-and-forget: do NOT await the n8n round-trip, the client will get the result via realtime
      const questionText = stepRow.is_follow_up
          ? (stepRow.custom_question ?? '')
              : (stepRow.questions?.question ?? '');

      const payload = {
              interview_id: stepRow.interview_id,
              step_id: stepRow.id,
              parent_step_id: stepRow.parent_step_id,
              is_follow_up: stepRow.is_follow_up,
              level: stepRow.interviews?.candidate_level ?? 'analyst',
              category: stepRow.questions?.category ?? null,
              subtopic: stepRow.questions?.subtopic ?? null,
              difficulty: stepRow.questions?.difficulty ?? null,
              question: questionText,
              user_answer: body.answer.trim(),
      };
        // Intentionally not awaited - returns to the client immediately
      fireEvaluationWebhook(payload);
  }

  // We still return the legacy shape for backwards compat, but the client should NOT auto-advance
  // based on data.next anymore - it must wait for ai_status='done' via realtime.
  return NextResponse.json({ ok: true, step_id: body.stepId, ...(data ?? {}) });
}
