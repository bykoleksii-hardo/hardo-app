import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Incremental Static Regeneration (ISR) / Data Cache is stored in Workers KV
// (binding: NEXT_INC_CACHE_KV). KV is eventually consistent — global propagation
// can take up to ~60s, which is fine for our cached routes (e.g. sitemap).
// No queue / tag cache is configured because the app uses no on-demand
// revalidation (revalidateTag / revalidatePath).
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
