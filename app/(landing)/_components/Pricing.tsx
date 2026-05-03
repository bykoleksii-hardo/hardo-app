import Link from 'next/link';

type Variant = 'anon' | 'free';

export default function Pricing({ variant }: { variant: Variant }) {
  return (
    <section id="pricing" className="py-24 border-t border-[#f5efe2]/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">Pricing</div>
        <h2 className="font-serif text-4xl md:text-5xl text-[#f5efe2] mb-12 max-w-2xl">One free try. One plan. Cancel anytime.</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <div className="border border-[#f5efe2]/10 rounded-lg p-8 bg-[#0a1628]/40">
            <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-3">Free</div>
            <div className="font-serif text-5xl text-[#f5efe2] mb-1">$0</div>
            <div className="text-[#f5efe2]/50 text-sm mb-6">No card required.</div>
            <ul className="space-y-3 text-sm text-[#f5efe2]/80 mb-8">
              <li>{'\u2022'} 1 full Intern-level interview</li>
              <li>{'\u2022'} Full scorecard and recommendation</li>
              <li>{'\u2022'} Saved to your profile</li>
            </ul>
            {variant === 'anon' ? (
              <Link href="/login" className="block text-center border border-[#f5efe2]/30 text-[#f5efe2] py-3 rounded hover:border-[#d4a04a] hover:text-[#d4a04a] transition">Sign up free</Link>
            ) : (
              <Link href="/interview/setup" className="block text-center border border-[#f5efe2]/30 text-[#f5efe2] py-3 rounded hover:border-[#d4a04a] hover:text-[#d4a04a] transition">Use my free interview</Link>
            )}
          </div>
          <div className="border border-[#d4a04a] rounded-lg p-8 bg-[#d4a04a]/5 relative">
            <div className="absolute top-3 right-3 text-[10px] text-[#0a1628] bg-[#d4a04a] px-2 py-1 rounded font-medium tracking-widest uppercase">Most picked</div>
            <div className="text-[#d4a04a] uppercase tracking-widest text-xs mb-3">Hardo</div>
            <div className="font-serif text-5xl text-[#f5efe2] mb-1">$12<span className="text-2xl text-[#f5efe2]/60">/mo</span></div>
            <div className="text-[#f5efe2]/50 text-sm mb-6">Monthly. Cancel anytime.</div>
            <ul className="space-y-3 text-sm text-[#f5efe2]/80 mb-8">
              <li>{'\u2022'} Unlimited interviews across all three levels</li>
              <li>{'\u2022'} Intern, Analyst, and Associate question pools</li>
              <li>{'\u2022'} Voice answers (Whisper transcription)</li>
              <li>{'\u2022'} Full history and trend tracking on your profile</li>
            </ul>
            <Link href={variant === 'anon' ? '/login?upgrade=1' : '/account/upgrade'} className="block text-center bg-[#d4a04a] text-[#0a1628] font-medium py-3 rounded hover:bg-[#d4a04a]/90 transition">
              {variant === 'anon' ? 'Get Hardo' : 'Upgrade to Hardo'}
            </Link>
          </div>
        </div>
        <p className="text-[#f5efe2]/40 text-xs mt-6 max-w-2xl">Pricing in USD. Subscription renews monthly until canceled. No long-term contract.</p>
      </div>
    </section>
  );
}
