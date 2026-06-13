'use client';

import { useState } from 'react';

export default function ShareLinkButton() {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] tracking-[0.22em] border border-ink/20 px-4 py-2 hover:text-gold transition-colors"
      aria-label="Copy share link"
    >
      {copied ? 'COPIED' : 'COPY LINK'}
    </button>
  );
}
