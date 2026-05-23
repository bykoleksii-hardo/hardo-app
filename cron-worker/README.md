# hardo-cron

Tiny Cloudflare Worker that runs a daily job to downgrade users whose paid period has expired.

## What it does

Once per day (03:00 UTC), calls Supabase RPC `public.downgrade_expired_subscriptions` which updates
`user_entitlements` rows where:
- `plan = 'paid'`
- `subscription_status IN ('cancelled','expired','unpaid','refunded')`
- `current_period_end IS NULL OR current_period_end <= now()`

setting `plan = 'free'`.

This is the safety-net for LemonSqueezy cancellations: when a user cancels, we keep them on
`paid` until their paid period ends (handled in `apply_lemonsqueezy_event`). Since LS does not
send any more webhooks after cancellation, this cron handles the eventual downgrade.

## Required env (set in Cloudflare Dashboard → Settings → Variables and Secrets)

| Name | Type | Value |
|---|---|---|
| `SUPABASE_URL` | Variable | `https://otmbwvjmkeescasfiswp.supabase.co` (already in wrangler.jsonc) |
| `SUPABASE_ANON_KEY` | Variable | Supabase project anon key |
| `CRON_RPC_SECRET` | **Secret** | Value of `public.app_secrets.cron_rpc_secret` (query in Supabase) |

## How to deploy via Cloudflare Workers Builds

1. Workers & Pages → Create → Worker → Connect to Git
2. Repo: `bykoleksii-hardo/hardo-app`
3. **Root directory: `cron-worker`**
4. Build command: `npm install`
5. Deploy command: `npx wrangler deploy`
6. Add env vars (above), redeploy
7. Verify cron trigger appears in worker's "Triggers" tab

## Manual test

After deploying, you can manually trigger the downgrade via HTTP:

```
curl -X GET https://hardo-cron.<your-subdomain>.workers.dev/run \
  -H "X-Cron-Trigger: <CRON_RPC_SECRET>"
```

Returns `{ ok: true, rows: [...] }` listing downgraded users.

You can also wait for the next 03:00 UTC trigger and check logs via `wrangler tail` or the dashboard.
