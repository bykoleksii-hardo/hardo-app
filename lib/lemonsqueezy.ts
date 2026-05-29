// Lemon Squeezy API client and webhook signature verification.
// Docs: https://docs.lemonsqueezy.com/api

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

function getApiKey(): string {
  const k = process.env.LEMONSQUEEZY_API_KEY;
  if (!k) throw new Error('LEMONSQUEEZY_API_KEY not configured');
  return k;
}

function getStoreId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id) throw new Error('LEMONSQUEEZY_STORE_ID not configured');
  return id;
}

interface LsRequestInit {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function lsFetch<T = unknown>(path: string, init: LsRequestInit = {}): Promise<T> {
  const res = await fetch(`${LS_API_BASE}${path}`, {
    method: init.method ?? 'GET',
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Lemon Squeezy ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export interface CheckoutSessionParams {
  variantId: string;
  userId: string;
  email?: string | null;
  name?: string | null;
  redirectUrl?: string;
}

export interface CheckoutSessionResult {
  url: string;
}

// Create a checkout for a variant. Returns the hosted checkout URL.
export async function createCheckoutSession(p: CheckoutSessionParams): Promise<CheckoutSessionResult> {
  const storeId = getStoreId();
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: p.email ?? undefined,
          name: p.name ?? undefined,
          custom: {
            user_id: p.userId,
          },
        },
        product_options: p.redirectUrl
          ? { redirect_url: p.redirectUrl }
          : undefined,
        checkout_options: {
          embed: false,
          dark: false,
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(p.variantId) } },
      },
    },
  };
  const json = await lsFetch<{ data: { attributes: { url: string } } }>(
    '/checkouts',
    { method: 'POST', body }
  );
  return { url: json.data.attributes.url };
}

export interface CustomerPortalResult {
  url: string;
}

// Get the customer portal URL for a given LS customer.
export async function getCustomerPortalUrl(customerId: string): Promise<CustomerPortalResult> {
  const json = await lsFetch<{
    data: { attributes: { urls: { customer_portal: string } } };
  }>(`/customers/${customerId}`);
  const url = json.data.attributes.urls?.customer_portal;
  if (!url) throw new Error('No customer_portal URL on customer ' + customerId);
  return { url };
}

// HMAC-SHA256 of body using webhook secret. Used to verify webhook signatures.
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHex: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHex) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  if (expected.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return diff === 0;
}

// Map LS subscription status -> our subscription_status column.
// LS statuses: on_trial, active, paused, past_due, unpaid, cancelled, expired
export function normalizeSubscriptionStatus(lsStatus: string | null | undefined): string | null {
  if (!lsStatus) return null;
  const s = String(lsStatus).toLowerCase();
  switch (s) {
    case 'active':
    case 'on_trial':
      return 'active';
    case 'paused':
      return 'paused';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'cancelled':
      return 'cancelled';
    case 'expired':
      return 'expired';
    default:
      return s;
  }
}
