/**
 * Client-side API helpers for HARDO.
 *
 * Use `apiFetch` for any call to a route wrapped with `withLogging` —
 * it surfaces the `x-request-id` so users can quote it in support.
 */

export type ApiErrorShape = {
  status: number;
  message: string;
  /** Short id surfaced by withLogging() — quote this in support tickets. */
  requestId: string | null;
  /** Raw body (already parsed JSON if possible, else text). */
  raw?: unknown;
};

export class ApiError extends Error {
  status: number;
  requestId: string | null;
  raw?: unknown;
  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'ApiError';
    this.status = shape.status;
    this.requestId = shape.requestId;
    this.raw = shape.raw;
  }
}

/**
 * Extract a user-facing error from a fetch Response.
 * Reads `x-request-id` header and tries to parse JSON body for
 * `{ friendly, error, message, requestId }` fields.
 */
export async function parseApiError(res: Response): Promise<ApiErrorShape> {
  const requestId =
    res.headers.get('x-request-id') ?? null;
  let raw: unknown = undefined;
  let bodyText = '';
  try {
    bodyText = await res.text();
    raw = bodyText ? JSON.parse(bodyText) : undefined;
  } catch {
    raw = bodyText;
  }
  const r = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const message =
    (typeof r.friendly === 'string' && r.friendly) ||
    (typeof r.message === 'string' && r.message) ||
    (typeof r.error === 'string' && r.error) ||
    `Request failed (${res.status})`;
  const bodyReqId = (typeof r.requestId === 'string' && r.requestId) || null;
  return {
    status: res.status,
    message,
    requestId: requestId || bodyReqId,
    raw,
  };
}

/**
 * Format an error message for display, appending the request id if present.
 *
 *   "The interviewer is unavailable right now. (id: 5b012854)"
 */
export function formatApiError(e: ApiErrorShape | ApiError | Error): string {
  if (e instanceof ApiError || (typeof (e as ApiErrorShape).requestId !== 'undefined')) {
    const shape = e as ApiErrorShape;
    if (shape.requestId) {
      return `${shape.message} (id: ${shape.requestId})`;
    }
    return shape.message;
  }
  return e.message || 'Unknown error';
}

/**
 * Thin fetch wrapper that throws ApiError on non-2xx with the requestId attached.
 *
 *   try {
 *     const data = await apiFetch<{ ok: boolean }>('/api/interview/turn', { method: 'POST', body: JSON.stringify({...}) });
 *   } catch (e) {
 *     setError(formatApiError(e as ApiError));
 *   }
 */
export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const shape = await parseApiError(res);
    throw new ApiError(shape);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
