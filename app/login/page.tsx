"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`
      }
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-md border-2 border-cream flex items-center justify-center">
              <span className="serif text-cream text-xl font-bold">H</span>
            </div>
            <span className="serif text-cream text-2xl tracking-wide">
              HARDO
            </span>
          </div>
          <h1 className="serif text-cream text-4xl md:text-5xl mb-4">
            Sign in to <em className="text-gold">practice</em>
          </h1>
          <p className="text-cream/70 text-sm leading-relaxed">
            We'll email you a one-time link.
            <br />
            No passwords, no friction.
          </p>
        </div>

        {sent ? (
          <div className="bg-cream/5 border border-gold/30 rounded-lg p-6 text-center">
            <div className="serif text-2xl text-gold mb-2">Check your inbox</div>
            <p className="text-cream/80 text-sm">
              We sent a magic link to <strong>{email}</strong>.
              <br />
              Click the link in the email to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-widest text-cream/60 mb-2 mono"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full bg-cream/5 border border-cream/20 rounded-md px-4 py-3 text-cream placeholder-cream/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-950/30 border border-red-800/50 rounded-md px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-cream text-navy py-3 px-6 rounded-md font-medium hover:bg-cream-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Sending..." : "Send magic link →"}
            </button>

            <p className="text-xs text-cream/40 text-center mt-6 mono">
              By signing in, you agree to our terms.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
