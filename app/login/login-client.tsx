'use client';

import Brand from '@/app/_components/Brand';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type Mode = 'signin' | 'signup' | 'verify';

export default function LoginClient() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function reset() {
    setError(null);
    setInfo(null);
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/interview/setup');
    router.refresh();
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo('We sent a code to your email.');
    setMode('verify');
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (code.length < 6) {
      setError('Enter the code.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/interview/setup');
    router.refresh();
  }

  async function resendCode() {
    reset();
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo('A new code has been sent.');
  }

  return (
    <div className="min-h-screen w-full bg-[#0a1628] text-[#f5efe2] grid lg:grid-cols-2">
      {/* LEFT  -  auth */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16">
        <div className="max-w-md w-full mx-auto">
          {/* Brand */}
          <div className="mb-12"><Brand size="md" href="/" /></div>

          {/* Mode tabs */}
          <div className="mb-8 text-xs tracking-[0.2em] uppercase text-[#f5efe2]/60 flex items-center gap-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); reset(); }}
              className={mode === 'signin' ? 'text-[#f5efe2] border-b border-[#d4a04a] pb-1' : 'hover:text-[#f5efe2]/90'}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); reset(); }}
              className={mode === 'signup' || mode === 'verify' ? 'text-[#f5efe2] border-b border-[#d4a04a] pb-1' : 'hover:text-[#f5efe2]/90'}
            >
              Create account
            </button>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-3">
            {mode === 'signin' && (<>Welcome <em className="text-[#d4a04a] not-italic font-serif italic">back.</em></>)}
            {mode === 'signup' && (<>Start your <em className="text-[#d4a04a] not-italic font-serif italic">prep.</em></>)}
            {mode === 'verify' && (<>Confirm your <em className="text-[#d4a04a] not-italic font-serif italic">email.</em></>)}
          </h1>
          <p className="text-[#f5efe2]/70 mb-10 leading-relaxed">
            {mode === 'signin' && 'Pick up where you left off.'}
            {mode === 'signup' && 'Eight characters minimum. No SSO yet  -  keep it simple.'}
            {mode === 'verify' && `We sent a code to ${email}. Enter it below.`}
          </p>

          {/* SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={onSignIn} className="space-y-5">
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-[#f5efe2]/20 px-4 py-3 outline-none focus:border-[#d4a04a] transition placeholder:text-[#f5efe2]/30"
                  placeholder="you@school.edu"
                />
              </Field>
              <Field label="Password" hint={
                <button type="button" onClick={() => setShowPw(s => !s)} className="text-[10px] tracking-[0.2em] uppercase text-[#f5efe2]/50 hover:text-[#d4a04a]">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              }>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#f5efe2]/20 px-4 py-3 outline-none focus:border-[#d4a04a] transition placeholder:text-[#f5efe2]/30"
                  placeholder="**********"
                />
              </Field>

              <Alert error={error} info={info} />

              <SubmitButton loading={loading}>Sign in &rarr;</SubmitButton>

              <p className="text-[11px] text-[#f5efe2]/50 pt-2">
                New here?{' '}
                <button type="button" className="underline underline-offset-2 hover:text-[#d4a04a]" onClick={() => { setMode('signup'); reset(); }}>
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={onSignUp} className="space-y-5">
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-[#f5efe2]/20 px-4 py-3 outline-none focus:border-[#d4a04a] transition placeholder:text-[#f5efe2]/30"
                  placeholder="you@school.edu"
                />
              </Field>
              <Field label="Password" hint={
                <button type="button" onClick={() => setShowPw(s => !s)} className="text-[10px] tracking-[0.2em] uppercase text-[#f5efe2]/50 hover:text-[#d4a04a]">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              }>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#f5efe2]/20 px-4 py-3 outline-none focus:border-[#d4a04a] transition placeholder:text-[#f5efe2]/30"
                  placeholder="At least 8 characters"
                />
              </Field>

              <Alert error={error} info={info} />

              <SubmitButton loading={loading}>Send code &rarr;</SubmitButton>

              <p className="text-[11px] text-[#f5efe2]/50 pt-2">
                Already have an account?{' '}
                <button type="button" className="underline underline-offset-2 hover:text-[#d4a04a]" onClick={() => { setMode('signin'); reset(); }}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* VERIFY */}
          {mode === 'verify' && (
            <form onSubmit={onVerify} className="space-y-5">
              <Field label="code">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
              minLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent border border-[#f5efe2]/20 px-4 py-3 text-2xl tracking-[0.5em] font-serif outline-none focus:border-[#d4a04a] transition placeholder:text-[#f5efe2]/30"
                  placeholder="******"
                />
              </Field>

              <Alert error={error} info={info} />

              <SubmitButton loading={loading}>Verify & continue &rarr;</SubmitButton>

              <div className="flex items-center justify-between text-[11px] text-[#f5efe2]/50 pt-2">
                <button type="button" onClick={resendCode} className="underline underline-offset-2 hover:text-[#d4a04a]">
                  Resend code
                </button>
                <button type="button" onClick={() => { setMode('signup'); setCode(''); reset(); }} className="hover:text-[#d4a04a]">
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {/* footer */}
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#f5efe2]/35 mt-12">
            By continuing you agree to our terms.
          </p>
        </div>
      </div>

      {/* RIGHT  -  pitch */}
      <div className="hidden lg:flex flex-col justify-center bg-[#0e1e36] border-l border-[#f5efe2]/10 px-16 py-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[#f5efe2]/60 mb-12">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a04a]" />
            <span>Built for IB recruiting</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] mb-8">
            Mock interviews that <em className="text-[#d4a04a] not-italic font-serif italic">actually</em> resemble the real thing.
          </h2>

          <p className="text-[#f5efe2]/70 leading-relaxed mb-12">
            Sharp answers. Unscripted follow-ups. A scorecard graded against bulge brackets and elite boutiques  -  not a generic rubric.
          </p>

          <ol className="space-y-6 text-sm">
            <Step n="01" title="Pick a vertical">M&amp;A, LBO, restructuring, valuation  -  or random.</Step>
            <Step n="02" title="Run the drill">Typed answers, technicals, fit. The interviewer presses back.</Step>
            <Step n="03" title="Read the scorecard">Specific feedback on math, structure, and what an MD would actually say.</Step>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.25em] uppercase text-[#f5efe2]/50">{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[#d4a04a] text-[#0a1628] font-medium py-3.5 px-6 hover:bg-[#e0b15c] transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
    >
      {loading ? 'Working...' : children}
    </button>
  );
}

function Alert({ error, info }: { error: string | null; info: string | null }) {
  if (!error && !info) return null;
  if (error) {
    return <div className="border border-red-400/40 bg-red-400/5 text-red-300 text-sm px-4 py-3">{error}</div>;
  }
  return <div className="border border-[#d4a04a]/40 bg-[#d4a04a]/5 text-[#d4a04a] text-sm px-4 py-3">{info}</div>;
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5 items-start">
      <span className="font-serif text-2xl text-[#d4a04a]/80 leading-none pt-0.5 w-10">{n}</span>
      <div>
        <div className="font-serif text-lg mb-1">{title}</div>
        <div className="text-[#f5efe2]/60">{children}</div>
      </div>
    </li>
  );
}
