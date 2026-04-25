import { createClient } from "@/lib/supabase/server";

export default async function InterviewSetupPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="text-xs mono uppercase tracking-widest text-gold mb-4">
            • SESSION SETUP
          </div>
          <h1 className="serif text-cream text-5xl md:text-6xl mb-6">
            Choose your <em className="text-gold">level</em>
          </h1>
          <p className="text-cream/70 max-w-xl">
            Each interview has 12 questions calibrated to the seniority you're
            targeting. Follow-ups stack on correct answers — wrong ones don't
            give you a free pass.
          </p>
        </div>

        <div className="text-cream/50 text-sm mono">
          Logged in as: {user?.email ?? "—"}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[
            {
              level: "intern",
              title: "Intern",
              desc: "Behavioral-heavy, fundamentals, light technicals."
            },
            {
              level: "analyst",
              title: "Analyst",
              desc: "Full technical battery: DCF, LBO, M&A math, accounting."
            },
            {
              level: "associate",
              title: "Associate",
              desc: "Multi-step cases, judgment calls, deal commentary."
            }
          ].map((opt) => (
            <button
              key={opt.level}
              className="text-left p-6 border border-cream/20 rounded-lg hover:border-gold transition group"
              disabled
            >
              <div className="serif text-cream text-2xl mb-2 group-hover:text-gold transition">
                {opt.title}
              </div>
              <div className="text-cream/60 text-sm leading-relaxed">
                {opt.desc}
              </div>
              <div className="mt-4 text-xs mono text-cream/30 uppercase">
                Coming soon
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
