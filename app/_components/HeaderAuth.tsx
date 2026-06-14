'use client';

import { useEffect, useState } from 'react';
import LandingHeader from '@/app/(landing)/_components/Header';

type Viewer = { signedIn: boolean; isAdmin: boolean; isPaid: boolean };

const ANON: Viewer = { signedIn: false, isAdmin: false, isPaid: false };

// Header for cached pages: server-renders the anonymous header (correct for the
// vast majority of article traffic — logged-out visitors and crawlers) and
// upgrades to the signed-in/paid/admin variant after a quick /api/viewer fetch.
// Initial client render equals the SSR output, so there is no hydration mismatch.
export default function HeaderAuth({ onLanding = false }: { onLanding?: boolean }) {
  const [v, setV] = useState<Viewer>(ANON);

  useEffect(() => {
    let alive = true;
    fetch('/api/viewer', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) {
          setV({ signedIn: !!d.signedIn, isAdmin: !!d.isAdmin, isPaid: !!d.isPaid });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <LandingHeader signedIn={v.signedIn} isAdmin={v.isAdmin} isPaid={v.isPaid} onLanding={onLanding} />;
}
