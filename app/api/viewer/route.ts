import { NextResponse } from 'next/server';
import { getViewerPlan } from '@/lib/quota/server';
import { getUserRole } from '@/lib/auth/roles';
import { withLogging } from '@/lib/observability';

// Lightweight auth snapshot for the client-side header island (<HeaderAuth>) on
// cached pages. Cached pages render the anonymous header server-side; this hydrates
// the signed-in / paid / admin chrome without forcing the whole page dynamic.
export const dynamic = 'force-dynamic';

export const GET = withLogging('viewer.get', async (_ctx) => {
  const viewer = await getViewerPlan();
  const signedIn = viewer.plan !== 'anon';
  const role = signedIn ? await getUserRole() : 'user';
  return NextResponse.json({
    signedIn,
    isPaid: viewer.plan === 'paid',
    isAdmin: role === 'admin' || role === 'editor',
  });
});
