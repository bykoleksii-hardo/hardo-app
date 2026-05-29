-- Axis 4 (Billing) hardening: webhook idempotency (dedup) + schema-drift note.
-- Part of audit issue #30.
--
-- Source of truth for entitlements is public.user_entitlements (see 2026_07 / 2026_08).
-- The historical 2026_01_lemonsqueezy.sql migration referenced public.users, which
-- predates the move to user_entitlements. Runtime no longer touches public.users for
-- billing; this migration records that and adds a dedup table so duplicate webhook
-- deliveries (LemonSqueezy retries) are applied at most once.
--
-- Apply via Supabase SQL Editor against staging first, then production.
-- Non-destructive: only CREATEs a new table + function. Does not touch
-- user_entitlements data and does not affect the 'hardo' (admin/comp) plan.

-- 1) Table of processed webhook deliveries. Keyed by the HMAC signature hex of the
--    raw body, which is unique per exact payload (identical retries share it).
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_key   text PRIMARY KEY,
  source      text NOT NULL DEFAULT 'lemonsqueezy',
  event_name  text,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies => no direct anon/authenticated access; the SECURITY DEFINER
-- function below bypasses RLS to record events.

-- 2) Claim a webhook event. Returns true if this is the first time we have seen
--    p_event_key (caller should process it), false if already processed (caller
--    should no-op and return 200). Validates the shared secret exactly like
--    apply_lemonsqueezy_event: compared against public.app_secrets value for key
--    'lemonsqueezy_rpc_secret'.
CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_secret     text,
  p_event_key  text,
  p_event_name text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected text;
  v_inserted integer;
BEGIN
  SELECT value INTO v_expected
    FROM public.app_secrets
   WHERE key = 'lemonsqueezy_rpc_secret';

  IF v_expected IS NULL OR p_secret IS NULL OR p_secret <> v_expected THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_event_key IS NULL OR length(p_event_key) = 0 THEN
    RETURN true;  -- no usable key => cannot dedup; allow processing
  END IF;

  INSERT INTO public.processed_webhook_events (event_key, event_name)
  VALUES (p_event_key, p_event_name)
  ON CONFLICT (event_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;  -- true = first time, false = duplicate
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_webhook_event(text, text, text) TO anon, authenticated;
