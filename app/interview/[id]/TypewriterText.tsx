'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Module-level set of message ids that have already animated in THIS page lifetime.
 * Survives re-renders within the SPA session, but not a full page reload.
 * This means: on a fresh interview, every new bubble types out once;
 * but if React re-renders the same bubble, it does not retype.
 */
const seenIds = new Set();

const CHAR_INTERVAL_MS = 25;

type Props = {
  id: string;
  text: string;
  onDone?: () => void;
};

export default function TypewriterText({ id, text, onDone }: Props) {
  const initialDone = seenIds.has(id);
  const [shown, setShown] = useState(initialDone ? text.length : 0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Always clear any previous interval before starting/skipping animation.
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Empty text — nothing to animate.
    if (!text) {
      seenIds.add(id);
      setShown(0);
      onDone?.();
      return;
    }

    // Already animated in this session — render full text immediately.
    if (seenIds.has(id)) {
      setShown(text.length);
      onDone?.();
      return;
    }

    // Fresh animation: start from 0, advance one char per tick.
    let cancelled = false;
    let i = 0;
    setShown(0);

    timerRef.current = window.setInterval(() => {
      if (cancelled) return;
      i += 1;
      setShown(i);
      if (i >= text.length) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        seenIds.add(id);
        onDone?.();
      }
    }, CHAR_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [id, text]);

  // Defensive: if text is non-empty and shown is 0 but we are marked as seen,
  // render full text anyway (handles edge case of remount after seenIds.add).
  const safeShown = seenIds.has(id) && shown < text.length ? text.length : shown;

  return <>{text.slice(0, safeShown)}</>;
}
