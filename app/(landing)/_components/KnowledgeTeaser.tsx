import Link from 'next/link';

export default function KnowledgeTeaser() {
  return (
    <section id="knowledge" className="border-t border-line bg-cream/40">
      <div className="max-w-page mx-auto px-6 py-20">
        <div className="kicker mb-3">Knowledge Hub</div>
        <h2 className="font-serif text-[44px] md:text-[52px] font-light leading-[1.05] tracking-[-0.02em] max-w-2xl">
          Notes from the desk.
        </h2>
        <p className="mt-5 text-ink-2 max-w-2xl leading-relaxed">
          Tactical breakdowns of the questions that decide an offer. Platform updates, industry context, and the rubric behind every grade.
        </p>

        <div className="mt-14 border border-line rounded-md bg-paper p-10 text-center">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted">Coming soon</div>
          <p className="mt-3 font-serif text-[24px] font-light leading-snug max-w-lg mx-auto">
            The first set of write-ups is in the editor. Check back shortly.
          </p>
          <Link
            href="/knowledge"
            className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] text-ink hover:text-gold transition-colors"
          >
            Open Knowledge Hub <span aria-hidden>{'\u2192'}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
