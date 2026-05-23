// hardo-cron — scheduled worker that downgrades users whose paid period has expired.
// Triggered daily at 03:00 UTC by Cloudflare Cron (see wrangler.jsonc).
//
// Calls Supabase RPC public.downgrade_expired_subscriptions(p_secret) which updates
// rows in user_entitlements where plan='paid' and current_period_end <= now() and
// subscription_status in (cancelled, expired, unpaid, refunded).
//
// Required env (set in Cloudflare dashboard):
//   SUPABASE_URL         (public) — Supabase project URL
//   SUPABASE_ANON_KEY    (public) — Supabase anon key (used for RPC; RPC is SECURITY DEFINER)
//   CRON_RPC_SECRET      (secret) — shared secret stored in public.app_secrets.cron_rpc_secret

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  CRON_RPC_SECRET: string;
}

interface DowngradedRow {
  user_id: string;
  prev_plan: string;
  prev_status: string;
  current_period_end: string | null;
}

async function runDowngrade(env: Env): Promise<{ ok: boolean; rows: DowngradedRow[]; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.CRON_RPC_SECRET) {
    return { ok: false, rows: [], error: "missing_env" };
  }
  const url = env.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/rpc/downgrade_expired_subscriptions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_secret: env.CRON_RPC_SECRET }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, rows: [], error: `rpc_http_${res.status}: ${text.slice(0, 500)}` };
  }
  const data = (await res.json()) as DowngradedRow[];
  return { ok: true, rows: Array.isArray(data) ? data : [] };
}

export default {
  // Scheduled handler — called by Cloudflare on cron trigger
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runDowngrade(env).then((r) => {
        if (r.ok) {
          console.log(
            `[hardo-cron] downgrade ok; rows=${r.rows.length}`,
            r.rows.map((x) => x.user_id),
          );
        } else {
          console.error(`[hardo-cron] downgrade failed: ${r.error}`);
        }
      }),
    );
  },

  // HTTP handler for manual test: GET /run with header X-Cron-Trigger: <CRON_RPC_SECRET>
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/health") return Response.json({ ok: true });
    if (url.pathname === "/run") {
      const auth = req.headers.get("x-cron-trigger");
      if (!env.CRON_RPC_SECRET || auth !== env.CRON_RPC_SECRET) {
        return new Response("unauthorized", { status: 401 });
      }
      const result = await runDowngrade(env);
      return Response.json(result, { status: result.ok ? 200 : 500 });
    }
    return new Response("hardo-cron", { status: 200 });
  },
};
