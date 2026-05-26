// hardo-cron — scheduled worker that runs periodic maintenance tasks.
// Triggered by Cloudflare Cron every 15 minutes (see wrangler.jsonc).
//
// Tasks performed each tick:
//   1) Downgrade users whose paid period has expired (RPC: downgrade_expired_subscriptions)
//   2) Publish scheduled knowledge articles whose publish_at <= now() (RPC: publish_due_articles)
//
// Required env (set in Cloudflare dashboard):
//   SUPABASE_URL         (public)  — Supabase project URL
//   SUPABASE_ANON_KEY    (public)  — Supabase anon key (used for RPC; RPCs are SECURITY DEFINER)
//   CRON_RPC_SECRET      (secret)  — shared secret stored in public.app_secrets (key='cron_rpc_secret')

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

interface PublishedArticleRow {
  id: string;
  slug: string;
  title: string;
  published_at: string | null;
}

async function callRpc<T>(env: Env, fn: string): Promise<{ ok: boolean; rows: T[]; error?: string }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.CRON_RPC_SECRET) {
    return { ok: false, rows: [], error: "missing_env" };
  }
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/${fn}`;
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
  const data = (await res.json()) as unknown;
  return { ok: true, rows: Array.isArray(data) ? (data as T[]) : [] };
}

async function runAll(env: Env): Promise<{
  downgrade: { ok: boolean; rows: DowngradedRow[]; error?: string };
  publish: { ok: boolean; rows: PublishedArticleRow[]; error?: string };
}> {
  const downgrade = await callRpc<DowngradedRow>(env, "downgrade_expired_subscriptions");
  const publish = await callRpc<PublishedArticleRow>(env, "publish_due_articles");
  return { downgrade, publish };
}

export default {
  // Scheduled handler — called by Cloudflare on cron trigger
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runAll(env).then((r) => {
        if (r.downgrade.ok) {
          if (r.downgrade.rows.length > 0) {
            console.log(
              `[hardo-cron] downgraded ${r.downgrade.rows.length} user(s):`,
              r.downgrade.rows.map((x) => x.user_id),
            );
          }
        } else {
          console.error(`[hardo-cron] downgrade failed: ${r.downgrade.error}`);
        }
        if (r.publish.ok) {
          if (r.publish.rows.length > 0) {
            console.log(
              `[hardo-cron] published ${r.publish.rows.length} article(s):`,
              r.publish.rows.map((x) => x.slug),
            );
          }
        } else {
          console.error(`[hardo-cron] publish_due_articles failed: ${r.publish.error}`);
        }
      }),
    );
  },

  // HTTP handler for manual test: GET /run with header X-Cron-Trigger: <CRON_RPC_SECRET>
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const auth = req.headers.get("X-Cron-Trigger") ?? "";
    if (url.pathname === "/run") {
      if (!env.CRON_RPC_SECRET || auth !== env.CRON_RPC_SECRET) {
        return new Response("unauthorized", { status: 401 });
      }
      const result = await runAll(env);
      const status = result.downgrade.ok && result.publish.ok ? 200 : 500;
      return Response.json(result, { status });
    }
    return new Response("hardo-cron", { status: 200 });
  },
};
