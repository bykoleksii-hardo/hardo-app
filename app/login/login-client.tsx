'use client';

import Brand from '@/app/_components/Brand';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type Mode = 'signin' | 'signup' | 'verify' | 'forgot' | 'forgotSent';

export default function LoginClient() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('signin');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [resetExpired, setResetExpired] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'expired') {
      setResetExpired(true);
      setMode('forgot');
    }
  }, []);

  function reset() {
    setError(null);
    setInfo(null);
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMode('forgotSent');
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
    router.push('/');
    router.refresh();
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!ageConfirmed) {
      setError('Please confirm you are at least 16 years old and accept the Terms.');
      return;
    }
    reset();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    // Pre-flight: check if email is already registered. Supabase's signUp
    // silently no-ops for existing users (anti-enumeration), which leaves
    // the user staring at a "we sent a code" screen that will never arrive.
    try {
      const r = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        const j = (await r.json()) as { exists?: boolean };
        if (j.exists) {
          setLoading(false);
          setError('This email is already registered. Sign in instead.');
          setMode('signin');
          return;
        }
      }
    } catch {
      // If the pre-check fails for any reason, fall through to signUp so we
      // never block account creation on a transient error.
    }
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
    if (code.length < 8) {
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
    router.push('/');
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
    <div className="min-h-screen w-full bg-[#FBF7EE] text-[#11161E] grid lg:grid-cols-2">
      {/* LEFT  -  auth */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16">
        <div className="max-w-md w-full mx-auto">
          {/* Brand */}
          <div className="mb-12"><Brand size="md" href="/" /></div>

          {resetExpired ? (
            <div className="mb-6 rounded-md border border-[#9C2E2E]/30 bg-[#9C2E2E]/5 px-4 py-3">
              <div className="text-[13px] font-medium text-[#9C2E2E]">Your reset link expired</div>
              <div className="mt-1 text-[12px] text-[#11161E]/70">Request a new password reset link below.</div>
            </div>
          ) : null}

          {/* Mode tabs */}
          {(mode === 'signin' || mode === 'signup' || mode === 'verify') && (
          <div className="mb-8 text-xs tracking-[0.2em] uppercase text-[#11161E]/60 flex items-center gap-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); reset(); }}
              className={mode === 'signin' ? 'text-[#11161E] border-b border-[#B88736] pb-1' : 'hover:text-[#11161E]/90'}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); reset(); }}
              className={mode === 'signup' || mode === 'verify' ? 'text-[#11161E] border-b border-[#B88736] pb-1' : 'hover:text-[#11161E]/90'}
            >
              Create account
            </button>
          </div>
          )}

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-3">
            {mode === 'signin' && (<>Welcome <em className="text-[#B88736] not-italic font-serif italic">back.</em></>)}
            {mode === 'signup' && (<>Start your <em className="text-[#B88736] not-italic font-serif italic">prep.</em></>)}
            {mode === 'verify' && (<>Confirm your <em className="text-[#B88736] not-italic font-serif italic">email.</em></>)}
          </h1>
          <p className="text-[#11161E]/70 mb-10 leading-relaxed">
            {mode === 'signin' && 'Pick up where you left off.'}
            {mode === 'signup' && 'Eight characters minimum. No SSO yet — keep it simple.'}
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
                  className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
                  placeholder="you@school.edu"
                />
              </Field>
              <Field label="Password" hint={
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => { setMode('forgot'); reset(); }} className="text-[10px] tracking-[0.2em] uppercase text-[#11161E]/50 hover:text-[#B88736]">
                    Forgot?
                  </button>
                  <button type="button" onClick={() => setShowPw(s => !s)} className="text-[10px] tracking-[0.2em] uppercase text-[#11161E]/50 hover:text-[#B88736]">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              }>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
                  placeholder="**********"
                />
              </Field>

              <Alert error={error} info={info} />

              <SubmitButton loading={loading}>Sign in &rarr;</SubmitButton>

              <p className="text-[11px] text-[#11161E]/50 pt-2">
                New here?{' '}
                <button type="button" className="underline underline-offset-2 hover:text-[#B88736]" onClick={() => { setMode('signup'); reset(); }}>
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
                  className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
                  placeholder="you@school.edu"
                />
              </Field>
              <Field label="Password" hint={
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => { setMode('forgot'); reset(); }} className="text-[10px] tracking-[0.2em] uppercase text-[#11161E]/50 hover:text-[#B88736]">
                    Forgot?
                  </button>
                  <button type="button" onClick={() => setShowPw(s => !s)} className="text-[10px] tracking-[0.2em] uppercase text-[#11161E]/50 hover:text-[#B88736]">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              }>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
                  placeholder="At least 8 characters"
                />
              </Field>

              <Alert error={error} info={info} />

              <label className="flex items-start gap-2 text-[12px] text-[#11161E]/70 leading-snug cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 shrink-0 accent-[#11161E]"
                />
                <span>
                  I confirm I am at least 16 years old and accept the{' '}
                  <a href="/legal/terms" className="underline hover:text-[#11161E]">Terms</a> and{' '}
                  <a href="/legal/privacy" className="underline hover:text-[#11161E]">Privacy Policy</a>.
                </span>
              </label>

              <SubmitButton loading={loading}>Send code &rarr;</SubmitButton>

              <p className="text-[11px] text-[#11161E]/50 pt-2">
                Already have an account?{' '}
                <button type="button" className="underline underline-offset-2 hover:text-[#B88736]" onClick={() => { setMode('signin'); reset(); }}>
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
              minLength={8}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 text-2xl tracking-[0.5em] font-serif outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
                  placeholder="******"
                />
              </Field>

              <Alert error={error} info={info} />

              <SubmitButton loading={loading}>Verify & continue &rarr;</SubmitButton>

              <div className="flex items-center justify-between text-[11px] text-[#11161E]/50 pt-2">
                <button type="button" onClick={resendCode} className="underline underline-offset-2 hover:text-[#B88736]">
                  Resend code
                </button>
                <button type="button" onClick={() => { setMode('signup'); setCode(''); reset(); }} className="hover:text-[#B88736]">
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD - request */}
          {mode === 'forgot' && (
            <form onSubmit={onForgot} className="space-y-5">
              <p className="text-[13px] text-[#11161E]/65 leading-relaxed">
                We{'\u2019'}ll email you a link to set a new password. The link expires in one hour.
              </p>

              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-[#11161E]/20 px-4 py-3 outline-none focus:border-[#B88736] transition placeholder:text-[#11161E]/30"
                  placeholder="you@school.edu"
                />
              </Field>

              <Alert error={error} info={info} />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B88736] text-[#FBF7EE] font-medium tracking-[0.05em] py-3.5 rounded-sm hover:bg-[#9C6F1E] transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending\u2026' : 'Send reset link \u2192'}
              </button>

              <p className="text-[11px] text-[#11161E]/50 pt-2">
                <button type="button" className="underline underline-offset-2 hover:text-[#B88736]" onClick={() => { setMode('signin'); reset(); }}>
                  Back to sign in
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD - sent confirmation */}
          {mode === 'forgotSent' && (
            <div className="space-y-5">
              <div className="text-[11px] tracking-[0.22em] text-[#B88736]">{'\u2014'} CHECK YOUR INBOX</div>
              <h3 className="font-serif text-2xl leading-snug">Reset link on the way.</h3>
              <p className="text-[13px] text-[#11161E]/65 leading-relaxed">
                If an account exists for <span className="text-[#11161E]">{email || 'that address'}</span>, a reset link is in your inbox now. Open it on this device to set a new password.
              </p>
              <p className="text-[12px] text-[#11161E]/50">
                Don{'\u2019'}t see it? Check spam, then{' '}
                <button type="button" className="underline underline-offset-2 hover:text-[#B88736]" onClick={() => { setMode('forgot'); reset(); }}>
                  resend the link
                </button>.
              </p>
              <p className="text-[11px] text-[#11161E]/50 pt-2">
                <button type="button" className="underline underline-offset-2 hover:text-[#B88736]" onClick={() => { setMode('signin'); reset(); }}>
                  Back to sign in
                </button>
              </p>
            </div>
          )}

          {/* footer */}
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#11161E]/35 mt-12">
            By continuing you agree to our <a href="/legal/terms" className="underline underline-offset-2 hover:text-[#B88736]">Terms</a> and <a href="/legal/privacy" className="underline underline-offset-2 hover:text-[#B88736]">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* RIGHT  -  pitch */}
      <div className="hidden lg:flex flex-col justify-center bg-[#F2ECDF] border-l border-[#11161E]/10 px-16 py-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[#11161E]/60 mb-12">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B88736]" />
            <span>Built for IB recruiting</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] mb-8">
            Mock interviews that <em className="text-[#B88736] not-italic font-serif italic">actually</em> resemble the real thing.
          </h2>

          <p className="text-[#11161E]/70 leading-relaxed mb-12">
            Sharp answers. Unscripted follow-ups. A scorecard graded against bulge brackets and elite boutiques — not a generic rubric.
          </p>

          <ol className="space-y-6 text-sm">
            <Step n="01" title="Pick a vertical">M&amp;A, LBO, restructuring, valuation — or random.</Step>
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
        <span className="text-[10px] tracking-[0.25em] uppercase text-[#11161E]/50">{label}</span>
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
      className="w-full bg-[#B88736] text-[#FBF7EE] font-medium py-3.5 px-6 hover:bg-[#B88736] transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
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
  return <div className="border border-[#B88736]/40 bg-[#B88736]/5 text-[#B88736] text-sm px-4 py-3">{info}</div>;
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5 items-start">
      <span className="font-serif text-2xl text-[#B88736]/80 leading-none pt-0.5 w-10">{n}</span>
      <div>
        <div className="font-serif text-lg mb-1">{title}</div>
        <div className="text-[#11161E]/60">{children}</div>
      </div>
    </li>
  );
}
