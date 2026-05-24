'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Module-level set of message ids that have already animated in THIS page lifetime.
 * Survives re-renders within the SPA session, but not a full page reload.
 * This means: on a fresh interview, every new bubble types out once;
 * but if React re-renders the same bubble, it does not retype.
 */
const seenIds = new Set<string>();

const CHAR_INTERVAL_MS = 25;

type Props = {
  id: string;
  text: string;
};

export default function TypewriterText({ id, text }: Props) {
  const initialDone = seenIds.has(id);
  const [shown, setShown] = useState<number>(initialDone ? text.length : 0);
  const timerRef = useRef<number | null>(null);
  const lastIdRef = useRef<string>(id);
  const lastTextRef = useRef<string>(text);

  useEffect(() => {
    // If id or text changes (rare — but possible on edit), reset animation.
    if (lastIdRef.current !== id || lastTextRef.current !== text) {
      lastIdRef.current = id;
      lastTextRef.current = text;
      if (seenIds.has(id)) {
        setShown(text.length);
        return;
      }
      setShown(0);
    }

    if (seenIds.has(id)) {
      // Already animated in this session — show immediately.
      setShown(text.length);
      return;
    }

    if (!text) {
      seenIds.add(id);
      return;
    }

    // Animate from current shown to text.length
    let i = shown;
    if (i >= text.length) {
      seenIds.add(id);
      return;
    }

    timerRef.current = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        seenIds.add(id);
      }
    }, CHAR_INTERVAL_MS);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // We intentionally do NOT include "shown" in deps — interval owns it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, text]);

  // Render: substring up to shown chars. Preserve whitespace exactly.
  return <>{text.slice(0, shown)}</>;
}
