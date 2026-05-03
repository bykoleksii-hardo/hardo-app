import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="border-t border-[#f5efe2]/10 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4 text-sm">
        <div>
          <div className="font-serif text-2xl text-[#f5efe2] mb-3">HARDO</div>
          <p className="text-[#f5efe2]/60 leading-relaxed">
            AI-powered Investment Banking mock interviews. Get graded against the bar before you sit the real one.
          </p>
        </div>
        <div>
          <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-3">Product</div>
          <ul className="space-y-2 text-[#f5efe2]/80">
            <li><Link href="/#how" className="hover:text-[#d4a04a]">How it works</Link></li>
            <li><Link href="/#pricing" className="hover:text-[#d4a04a]">Pricing</Link></li>
            <li><Link href="/#faq" className="hover:text-[#d4a04a]">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-3">Resources</div>
          <ul className="space-y-2 text-[#f5efe2]/80">
            <li><Link href="/knowledge" className="hover:text-[#d4a04a]">Knowledge Hub</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[#f5efe2]/40 uppercase tracking-widest text-xs mb-3">Legal</div>
          <ul className="space-y-2 text-[#f5efe2]/80">
            <li><Link href="/legal/terms" className="hover:text-[#d4a04a]">Terms</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-[#d4a04a]">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#f5efe2]/10">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-[#f5efe2]/40 flex flex-col sm:flex-row justify-between gap-2">
          <span>{'\u00a9'} {new Date().getFullYear()} HARDO. All rights reserved.</span>
          <span>Cancel anytime. Monthly billing.</span>
        </div>
      </div>
    </footer>
  );
}
