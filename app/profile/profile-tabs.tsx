'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/profile', label: 'Overview' },
  { href: '/profile/history', label: 'History' },
  { href: '/profile/about', label: 'About me' },
  { href: '/profile/account', label: 'Account' },
];

export function ProfileTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-12">
      <div className="text-[11px] tracking-[0.22em] text-[#B88736] mb-4">- YOUR PROFILE</div>
      <h1 className="font-serif text-5xl leading-[1.05] mb-8">
        Your <span className="italic text-[#B88736]">superday</span> dashboard.
      </h1>
      <nav className="flex gap-8 border-b border-[#11161E]/10">
        {TABS.map((t) => {
          const active =
            t.href === '/profile'
              ? pathname === '/profile'
              : pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px pb-4 text-sm tracking-[0.05em] transition-colors border-b-2 ${
                active ? 'border-[#B88736] text-[#11161E]' : 'border-transparent text-[#11161E]/55 hover:text-[#11161E]'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
