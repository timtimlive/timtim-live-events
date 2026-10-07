/**
 * Something went wrong before or around a request: a key is needed, a server
 * key was used in a browser, the network failed, or the call timed out.
 */
export class TimTimError extends Error {
  /** A stable, machine-readable reason, e.g. `key_required`, `timeout`. */
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TimTimError";
    this.code = code;
  }
}

/**
 * The API answered with a problem (`application/problem+json`, RFC 9457).
 * Send `requestId` to TimTim.Live support and they can find your request.
 */
export class TimTimApiError extends TimTimError {
  /** HTTP status, e.g. 401, 404, 429. */
  readonly status: number;
  /** Problem type URI. */
  readonly type: string | null;
  /** A short sentence a person can read. */
  readonly title: string;
  /** What to do about it. */
  readonly detail: string | null;
  /** From the body's `request_id`, or the `TimTim-Request-Id` header. */
  readonly requestId: string | null;
  /** Seconds to wait before trying again (from `Retry-After`), or null. */
  readonly retryAfter: number | null;
  /** The parsed response body, if it was JSON. */
  readonly body: unknown;

  constructor(init: {
    status: number;
    code: string;
    type: string | null;
    title: string;
    detail: string | null;
    requestId: string | null;
    retryAfter: number | null;
    body: unknown;
  }) {
    const parts = [init.title, init.detail].filter(Boolean).join(" ");
    super(init.code, `${parts || `HTTP ${init.status}`}${init.requestId ? ` (request ${init.requestId})` : ""}`);
    this.name = "TimTimApiError";
    this.status = init.status;
    this.type = init.type;
    this.title = init.title;
    this.detail = init.detail;
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
    this.body = init.body;
  }
}

/** `Retry-After` is either seconds or an HTTP date. Returns whole seconds (>= 0) or null. */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | null {
  if (value == null || value.trim() === "") return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.ceil((at - now) / 1000));
}

function str(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

/** Builds a TimTimApiError from a non-2xx response and its (maybe) parsed body. */
export function apiErrorFrom(response: Response, body: unknown): TimTimApiError {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  /* Problem (RFC 9457) first; the OAuth endpoints answer RFC 6749 errors instead. */
  const code = str(b.code) ?? str(b.error) ?? `http_${response.status}`;
  const title = str(b.title) ?? str(b.error_description) ?? (response.statusText || `HTTP ${response.status}`);
  return new TimTimApiError({
    status: response.status,
    code,
    type: str(b.type),
    title,
    detail: str(b.detail),
    requestId: str(b.request_id) ?? response.headers.get("TimTim-Request-Id"),
    retryAfter: parseRetryAfter(response.headers.get("Retry-After")),
    body,
  });
}
