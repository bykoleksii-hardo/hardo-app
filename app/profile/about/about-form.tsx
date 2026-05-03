'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';

interface Props {
  initial: UserProfile | null;
  email: string;
}

type FormState = {
  first_name: string;
  last_name: string;
  preferred_name: string;
  date_of_birth: string;
  country: string;
  city: string;
  university: string;
  major: string;
  graduation_year: string;
  current_position: string;
  target_start_date: string;
  cv_summary: string;
  bio: string;
  use_in_persona: boolean;
};

function fromProfile(p: UserProfile | null): FormState {
  return {
    first_name: p?.first_name ?? '',
    last_name: p?.last_name ?? '',
    preferred_name: p?.preferred_name ?? '',
    date_of_birth: p?.date_of_birth ?? '',
    country: p?.country ?? '',
    city: p?.city ?? '',
    university: p?.university ?? '',
    major: p?.major ?? '',
    graduation_year: p?.graduation_year ? String(p.graduation_year) : '',
    current_position: p?.current_position ?? '',
    target_start_date: p?.target_start_date ?? '',
    cv_summary: p?.cv_summary ?? '',
    bio: p?.bio ?? '',
    use_in_persona: p?.use_in_persona ?? true,
  };
}

export function AboutForm({ initial, email }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(fromProfile(initial));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeness = useMemo(() => {
    const required = [
      state.first_name,
      state.last_name,
      state.country,
      state.university,
      state.major,
      state.cv_summary,
    ];
    const filled = required.filter((v) => v.trim().length > 0).length;
    return Math.round((filled / required.length) * 100);
  }, [state]);

  const showWizard = !initial || !initial.first_name;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: state.first_name || null,
          last_name: state.last_name || null,
          preferred_name: state.preferred_name || null,
          date_of_birth: state.date_of_birth || null,
          country: state.country || null,
          city: state.city || null,
          university: state.university || null,
          major: state.major || null,
          graduation_year: state.graduation_year ? Number(state.graduation_year) : null,
          current_position: state.current_position || null,
          target_start_date: state.target_start_date || null,
          cv_summary: state.cv_summary || null,
          bio: state.bio || null,
          use_in_persona: state.use_in_persona,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Save failed');
      setSavedAt(Date.now());
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10 max-w-3xl pb-32">
      {showWizard && (
        <div className="border border-[#d4a04a]/40 rounded-sm p-6 bg-[#d4a04a]/5">
          <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-2">- WELCOME</div>
          <h2 className="font-serif text-2xl mb-2">Let's set up your room.</h2>
          <p className="text-sm text-[#f5efe2]/70 max-w-xl">A few details so the interviewer doesn't sound generic. Everything's optional - you can fill it out now or come back later.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#f5efe2]/10 rounded-sm overflow-hidden">
              <div className="h-full bg-[#d4a04a] transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/65">{completeness}% complete</span>
          </div>
        </div>
      )}

      <section className="border border-[#f5efe2]/10 rounded-sm p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-1">- PERSONALIZATION</div>
            <h3 className="font-serif text-xl mb-1">Use my profile in interviews</h3>
            <p className="text-sm text-[#f5efe2]/65 max-w-xl">When on, the interviewer can reference your school, role, and background to ask sharper, more personal follow-ups.</p>
          </div>
          <button
            type="button"
            onClick={() => update('use_in_persona', !state.use_in_persona)}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${state.use_in_persona ? 'bg-[#d4a04a]' : 'bg-[#f5efe2]/20'}`}
            aria-pressed={state.use_in_persona}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-[#0a1628] transition-transform ${state.use_in_persona ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      <Section title="IDENTITY" subtitle="Your name and how the interviewer should address you.">
        <Row>
          <Field label="First name" value={state.first_name} onChange={(v) => update('first_name', v)} />
          <Field label="Last name" value={state.last_name} onChange={(v) => update('last_name', v)} />
        </Row>
        <Row>
          <Field label="Preferred name (optional)" value={state.preferred_name} onChange={(v) => update('preferred_name', v)} />
          <Field label="Date of birth" type="date" value={state.date_of_birth} onChange={(v) => update('date_of_birth', v)} />
        </Row>
      </Section>

      <Section title="LOCATION" subtitle="Where you're based right now.">
        <Row>
          <Field label="Country" value={state.country} onChange={(v) => update('country', v)} />
          <Field label="City" value={state.city} onChange={(v) => update('city', v)} />
        </Row>
      </Section>

      <Section title="EDUCATION" subtitle="School, major, and graduation timeline.">
        <Row>
          <Field label="University" value={state.university} onChange={(v) => update('university', v)} />
          <Field label="Major" value={state.major} onChange={(v) => update('major', v)} />
        </Row>
        <Row>
          <Field label="Graduation year" type="number" value={state.graduation_year} onChange={(v) => update('graduation_year', v)} />
          <Field label="Target start date" type="date" value={state.target_start_date} onChange={(v) => update('target_start_date', v)} />
        </Row>
      </Section>

      <Section title="EXPERIENCE" subtitle="What you're doing now and a short professional summary.">
        <Field label="Current position" value={state.current_position} onChange={(v) => update('current_position', v)} />
        <TextArea
          label="CV summary"
          hint="2-4 sentences: previous internships, deals you've touched, technical skills."
          value={state.cv_summary}
          onChange={(v) => update('cv_summary', v)}
          rows={5}
        />
        <TextArea
          label="Bio (optional)"
          hint="Anything personal you want the interviewer to know - hobbies, motivations, why banking."
          value={state.bio}
          onChange={(v) => update('bio', v)}
          rows={4}
        />
      </Section>

      <div className="sticky bottom-6 flex items-center justify-between gap-4 border border-[#f5efe2]/15 rounded-sm bg-[#0e1c33]/95 backdrop-blur px-6 py-4">
        <div className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">
          {error ? <span className="text-[#e89292]">{error.toUpperCase()}</span>
            : savedAt ? <span className="text-[#9ed490]">SAVED</span>
            : <span>SIGNED IN AS {email.toUpperCase()}</span>}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#d4a04a] text-[#0a1628] font-medium tracking-[0.05em] px-7 py-3 rounded-sm hover:bg-[#c8923a] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving\u2026' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] tracking-[0.22em] text-[#d4a04a]">- {title}</div>
        {subtitle && <p className="text-sm text-[#f5efe2]/60 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, value, onChange, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">{label.toUpperCase()}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-[#0e1c33] border border-[#f5efe2]/15 px-4 py-3 rounded-sm text-[#f5efe2] focus:outline-none focus:border-[#d4a04a] transition-colors"
      />
      {hint && <span className="text-[11px] text-[#f5efe2]/45 mt-1 block">{hint}</span>}
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.18em] text-[#f5efe2]/55">{label.toUpperCase()}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-2 w-full bg-[#0e1c33] border border-[#f5efe2]/15 px-4 py-3 rounded-sm text-[#f5efe2] focus:outline-none focus:border-[#d4a04a] transition-colors resize-y"
      />
      {hint && <span className="text-[11px] text-[#f5efe2]/45 mt-1 block">{hint}</span>}
    </label>
  );
}
