'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/knowledge/markdown';

/** Sticky on-this-page nav with scroll-spy highlighting of the active section. */
export default function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.slug ?? '');

  useEffect(() => {
    const els = items
      .map((it) => document.getElementById(it.slug))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -68% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page" className="sticky top-24 text-[12.5px]">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">On this page</div>
      <ul className="border-l border-line">
        {items.map((it) => {
          const isActive = active === it.slug;
          return (
            <li key={it.slug}>
              <a
                href={`#${it.slug}`}
                className={`block -ml-px border-l-2 py-1.5 leading-snug transition-colors ${
                  it.level === 3 ? 'pl-7' : 'pl-3'
                } ${isActive ? 'border-gold text-ink' : 'border-transparent text-ink-2 hover:text-ink'}`}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
