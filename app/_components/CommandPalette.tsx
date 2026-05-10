'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  group: 'GO' | 'INTERVIEW' | 'ACCOUNT' | 'LEGAL' | 'HELP' | 'ADMIN';
  href?: string;
  action?: () => void;
  adminOnly?: boolean;
  keywords?: string;
};

const COMMANDS: Cmd[] = [
  { id: 'home', label: 'Home', hint: '/', group: 'GO', href: '/' },
  { id: 'how', label: 'How it works', hint: '/#how', group: 'GO', href: '/#how' },
  { id: 'voice', label: 'Voice mode', hint: '/#voice', group: 'GO', href: '/#voice' },
  { id: 'measure', label: 'What we measure', hint: '/#measure', group: 'GO', href: '/#measure' },
  { id: 'pricing', label: 'Pricing', hint: '/#pricing', group: 'GO', href: '/#pricing' },
  { id: 'faq', label: 'FAQ', hint: '/#faq', group: 'GO', href: '/#faq' },
  { id: 'knowledge', label: 'Knowledge Hub', hint: '/knowledge', group: 'GO', href: '/knowledge' },

  { id: 'start', label: 'Start a new interview', hint: '/interview/setup', group: 'INTERVIEW', href: '/interview/setup', keywords: 'mock practice begin' },
  { id: 'history', label: 'Past interviews', hint: '/profile', group: 'INTERVIEW', href: '/profile', keywords: 'history past scorecards' },

  { id: 'login', label: 'Sign in', hint: '/login', group: 'ACCOUNT', href: '/login' },
  { id: 'signup', label: 'Sign up', hint: '/login', group: 'ACCOUNT', href: '/login', keywords: 'register create account' },
  { id: 'upgrade', label: 'Upgrade to HARDO', hint: '/upgrade', group: 'ACCOUNT', href: '/upgrade', keywords: 'pro paid premium subscribe' },
  { id: 'profile', label: 'Profile & settings', hint: '/profile', group: 'ACCOUNT', href: '/profile', keywords: 'account settings' },

  { id: 'terms', label: 'Terms of Service', hint: '/legal/terms', group: 'LEGAL', href: '/legal/terms' },
  { id: 'privacy', label: 'Privacy Policy', hint: '/legal/privacy', group: 'LEGAL', href: '/legal/privacy' },

  { id: 'contact', label: 'Contact us', hint: 'mailto:hello@hardo.app', group: 'HELP', href: 'mailto:hello@hardo.app', keywords: 'email support help' },,
  { id: 'admin-knowledge', label: 'Admin: Knowledge Hub', hint: '/admin/knowledge', group: 'ADMIN', href: '/admin/knowledge', adminOnly: true, keywords: 'admin manage articles cms' }
];

function score(cmd: Cmd, q: string): number {
  if (!q) return 1;
  const hay = (cmd.label + ' ' + (cmd.hint ?? '') + ' ' + (cmd.keywords ?? '') + ' ' + cmd.group).toLowerCase();
  const needle = q.toLowerCase().trim();
  if (!needle) return 1;
  // exact substring match in label gets boosted
  if (cmd.label.toLowerCase().includes(needle)) return 100;
  if (hay.includes(needle)) return 50;
  // fuzzy: every char of needle appears in order in haystack
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) {
    if (hay[j] === needle[i]) i++;
  }
  return i === needle.length ? 10 : 0;
}

export default function CommandPalette({ isAdmin = false }: { isAdmin?: boolean }) {
  const visibleCommands = isAdmin ? COMMANDS : COMMANDS.filter((c) => !c.adminOnly);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isToggle =
        ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) ||
        (e.key === '/' && !open && !isTyping(e.target));
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (open && e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      // focus next tick
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => {
    const arr = visibleCommands.map((c) => ({ c, s: score(c, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return arr.map((x) => x.c);
  }, [q]);

  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results, active]);

  if (!open) return null;

  function run(c: Cmd) {
    setOpen(false);
    if (c.action) {
      c.action();
      return;
    }
    if (c.href) {
      if (c.href.startsWith('mailto:') || c.href.startsWith('http')) {
        window.location.href = c.href;
      } else {
        router.push(c.href);
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(0, results.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = results[active];
      if (c) run(c);
    }
  }

  // Group results in rendering order
  const groupOrder: Cmd['group'][] = ['ADMIN', 'INTERVIEW', 'GO', 'ACCOUNT', 'LEGAL', 'HELP'];
  const grouped: Record<string, Cmd[]> = {};
  for (const c of results) {
    (grouped[c.group] ||= []).push(c);
  }

  let runningIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-[#11161E]/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-[#FBF7EE] border border-[#11161E]/15 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#11161E]/10">
          <span className="text-[11px] tracking-[0.22em] text-[#B88736]">CMD K</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            aria-label="Command input"
            className="flex-1 bg-transparent text-[14px] text-[#11161E] placeholder:text-[#11161E]/40 outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[10px] tracking-[0.22em] text-[#11161E]/50 hover:text-[#B88736]"
            aria-label="Close"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[#11161E]/55">
              No results.
            </div>
          ) : (
            groupOrder
              .filter((g) => grouped[g]?.length)
              .map((g) => (
                <div key={g} className="py-1">
                  <div className="px-4 pt-2 pb-1 text-[10px] tracking-[0.22em] text-[#11161E]/40">{g}</div>
                  <ul>
                    {grouped[g].map((c) => {
                      runningIdx++;
                      const isActive = runningIdx === active;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(runningIdx)}
                            onClick={() => run(c)}
                            className={
                              'w-full text-left px-4 py-2 flex items-center justify-between gap-4 ' +
                              (isActive
                                ? 'bg-[#B88736]/10 text-[#11161E]'
                                : 'text-[#11161E]/85 hover:bg-[#B88736]/5')
                            }
                          >
                            <span className="text-[14px]">{c.label}</span>
                            <span className="text-[11px] tracking-[0.22em] text-[#11161E]/40 font-mono">{c.hint}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#11161E]/10 flex items-center justify-between text-[10px] tracking-[0.22em] text-[#11161E]/45">
          <span>↑ ↓ NAVIGATE · ↵ OPEN</span>
          <span>HARDO</span>
        </div>
      </div>
    </div>
  );
}

function isTyping(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}
