import Link from 'next/link';

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-[#0a1628] text-[#f5efe2] font-inter">
      <div className="flex items-center justify-between px-12 py-8 border-b border-[#f5efe2]/10">
        <Link href="/interview/setup" className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#f5efe2]/40 flex items-center justify-center font-playfair text-lg italic">H</div>
          <span className="tracking-[0.18em] text-sm">HARDO</span>
        </Link>
        <Link href="/interview/setup" className="text-xs tracking-[0.18em] text-[#f5efe2]/55 hover:text-[#d4a04a] transition-colors">
          BACK TO SETUP
        </Link>
      </div>

      <main className="max-w-[920px] mx-auto px-12 py-24">
        <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-4">- UPGRADE</div>
        <h1 className="font-playfair text-5xl leading-[1.05] mb-6">
          Unlock the <span className="italic text-[#d4a04a]">full superday</span>.
        </h1>
        <p className="text-[#f5efe2]/65 max-w-xl text-lg leading-relaxed mb-12">
          The free tier gives you one Intern run to feel the room.
          The paid plan unlocks Analyst and Associate, plus unlimited interviews so you can drill until the answers are reflex.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          <div className="border border-[#f5efe2]/15 rounded-sm p-7">
            <div className="text-[11px] tracking-[0.22em] text-[#f5efe2]/55 mb-3">FREE</div>
            <div className="font-playfair text-3xl mb-4">$0</div>
            <ul className="text-sm text-[#f5efe2]/70 space-y-2 leading-relaxed">
              <li>- 1 Intern interview, lifetime</li>
              <li>- Full scorecard and feedback</li>
              <li>- No card required</li>
            </ul>
          </div>
          <div className="border border-[#d4a04a] bg-[#0e1c33] rounded-sm p-7">
            <div className="text-[11px] tracking-[0.22em] text-[#d4a04a] mb-3">PAID - COMING SOON</div>
            <div className="font-playfair text-3xl mb-4">
              $12<span className="text-base text-[#f5efe2]/55"> / month</span>
            </div>
            <ul className="text-sm text-[#f5efe2]/85 space-y-2 leading-relaxed">
              <li>- Unlimited interviews</li>
              <li>- All levels: Intern, Analyst, Associate</li>
              <li>- Full scorecard and feedback every run</li>
              <li>- Cancel anytime</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#f5efe2]/10 pt-8">
          <button
            disabled
            className="bg-[#d4a04a]/40 text-[#0a1628]/70 font-medium tracking-[0.05em] px-9 py-4 rounded-sm cursor-not-allowed"
          >
            Payments launching soon
          </button>
          <p className="mt-4 text-xs tracking-[0.18em] text-[#f5efe2]/45">
            CHECKOUT GOES LIVE ONCE THE PAYMENT PROVIDER IS WIRED IN.
          </p>
        </div>
      </main>
    </div>
  );
}
