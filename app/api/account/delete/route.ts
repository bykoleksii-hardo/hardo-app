import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getUserRole, isStaff } from '@/lib/auth/roles';
import { withLogging, logger } from '@/lib/observability';

/**
 * Subscription statuses where billing is still live and the customer may still
 * be charged. Deletion is blocked in these states so the user cancels billing
 * (via the customer portal) before removing the account.
 */
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'on_trial', 'past_due'];

/**
 * POST /api/account/delete
 * GDPR art. 17 (right to erasure): permanently deletes the authenticated
 * user's account and all associated personal data.
 *
 * Guards:
 *  - staff/admin accounts cannot self-delete via this endpoint;
 *  - accounts with a live subscription must cancel billing first;
 *  - requires an explicit { confirm: 'DELETE' } body.
 *
 * All user-data tables cascade from the auth user via ON DELETE CASCADE, so a
 * single admin deleteUser() call removes profile, entitlements, skills,
 * question exposure, interviews and their child rows.
 */
export const POST = withLogging('account.delete', async (req: Request) => {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = user.id;

  // Require explicit confirmation token in the request body.
  let confirm: unknown;
  try {
    const body = await req.json();
    confirm = body?.confirm;
  } catch {
    confirm = undefined;
  }
  if (confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation required', code: 'confirm_required' },
      { status: 400 },
    );
  }

  // Guard: staff/admin accounts must not be self-deletable.
  const role = await getUserRole();
  if (isStaff(role)) {
    logger.warn('account delete blocked for staff account', { userId: uid, role });
    return NextResponse.json(
      { error: 'Staff accounts cannot be deleted from here.', code: 'staff_blocked' },
      { status: 403 },
    );
  }

  // Guard: block deletion while a subscription is still live.
  const { data: entitlement } = await supabase
    .from('user_entitlements')
    .select('subscription_status, lemonsqueezy_subscription_id')
    .eq('user_id', uid)
    .maybeSingle();

  if (
    entitlement?.lemonsqueezy_subscription_id &&
    ACTIVE_SUBSCRIPTION_STATUSES.includes(entitlement.subscription_status ?? '')
  ) {
    return NextResponse.json(
      {
        error:
          'You have an active subscription. Please cancel it in billing before deleting your account.',
        code: 'active_subscription',
      },
      { status: 409 },
    );
  }

  // Perform the deletion with the service-role client. Cascading FKs remove all
  // owned rows; this also removes the auth user record itself.
  const admin = getSupabaseAdmin();
  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);

  if (deleteError) {
    logger.error('account delete failed', deleteError, { userId: uid });
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 },
    );
  }

  logger.info('account deleted', { userId: uid });

  // Best-effort: clear the current session cookies on the server side.
  try {
    await supabase.auth.signOut();
  } catch {
    // session is already invalid once the user is gone; ignore.
  }

  return NextResponse.json({ ok: true });
});
