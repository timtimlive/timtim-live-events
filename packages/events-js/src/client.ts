import { TimTimApiError, TimTimError, apiErrorFrom } from "./errors.js";
import type {
  CategoryList,
  CreateOrderBody,
  DemoCategoryList,
  DemoEventList,
  DemoLocationList,
  ListCategoriesParams,
  ListLocationsParams,
  LocationList,
  TrackSignal,
  EarningList,
  EventList,
  EventResponse,
  FeedFile,
  FeedParams,
  ListDemoEventsParams,
  ListEventsParams,
  ListOffersParams,
  OfferList,
  Order,
  SettlementList,
  TicketTypeList,
} from "./types.js";

/** The Partner API address. The same API also answers at https://timtim.live/v1. */
export const DEFAULT_BASE_URL = "https://api.timtim.live/v1";
export const DEFAULT_TIMEOUT_MS = 30_000;
export const SDK_VERSION = "0.1.0";

const DASHBOARD = "https://timtim.live/partners/dashboard";

/** Filters the keyless demo endpoint understands (operation listDemoEvents), besides `simulate`. */
const DEMO_FILTERS = new Set(["city", "country", "category", "from", "to", "near", "artist", "limit", "cursor"]);

/** The contract's Idempotency-Key pattern for POST /orders. */
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,80}$/;

export type FeedFormat = "json" | "rss" | "xml" | "csv" | "ics";
/* Compile-time proof that every FeedFormat is a file the contract lists. */
type _FeedFormatsAreFiles = `events.${FeedFormat}` extends FeedFile ? true : never;
const _feedCheck: _FeedFormatsAreFiles = true;
void _feedCheck;

export interface TimTimEventsOptions {
  /**
   * Your key. Leave it out to use demo mode (sample events, no sign-up).
   * - `tt_test_…` sandbox key — sample events only, no real money.
   * - `tt_pk_live_…` website key — safe in a browser, locked to your domains.
   * - `tt_sk_live_…` server key — NEVER in a browser; this SDK refuses it there.
   * An OAuth access token (`tt_at_…`) works here too, on a server.
   */
  apiKey?: string;
  /** Default https://api.timtim.live/v1. */
  baseUrl?: string;
  /** Your own fetch (for tests, proxies or old runtimes). Default: the global fetch. */
  fetch?: typeof fetch;
  /** Give up after this many milliseconds. Default 30000. */
  timeoutMs?: number;
  /**
   * Try a failed READ again, up to this many times (0–5). Default 0: no retries.
   * Only GET requests, and only when trying again can help: no answer, a
   * timeout, 429 (too many requests), 502, 503 or 504. Each wait is longer than
   * the last, with a random part so many visitors do not all retry at once. If
   * TimTim.Live says how long to wait (Retry-After), that is the wait.
   */
  retries?: number;
  /** The longest single wait between retries, in milliseconds. Default 10000. A Retry-After longer than this is not waited for: the error is thrown. */
  maxRetryDelayMs?: number;
}

/* Statuses where the same request may succeed a moment later. */
const RETRY_STATUSES = new Set([429, 502, 503, 504]);
const RETRY_BASE_MS = 500;

/**
 * How long to wait before retry number `attempt` (0 = the first retry), or null
 * to stop. A server's Retry-After (seconds) wins when it fits under `maxMs`;
 * otherwise "full jitter": a random wait up to 500 ms × 2^attempt, capped.
 */
export function retryDelayMs(attempt: number, retryAfterS: number | null, maxMs: number, random: () => number = Math.random): number | null {
  if (retryAfterS !== null) {
    const ms = Math.max(0, retryAfterS) * 1000;
    return ms <= maxMs ? ms : null;
  }
  return Math.floor(random() * Math.min(maxMs, RETRY_BASE_MS * 2 ** attempt));
}

type QueryValue = string | number | boolean | null | undefined;
type Query = Record<string, QueryValue>;

/** `?a=1&b=two` from an object; leaves out undefined/null/"" values. */
export function toQueryString(params?: Query): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.append(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function isServerOnlyKey(key: string): boolean {
  return key.startsWith("tt_sk_live_") || key.startsWith("tt_at_");
}

function inBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * The TimTim.Live events client.
 *
 *   const tt = new TimTimEvents();                       // demo mode: sample events, no key
 *   const { events } = await tt.events.list({ city: "Miami", category: "music" });
 *
 *   const live = new TimTimEvents({ apiKey: process.env.TIMTIM_KEY });
 */
export class TimTimEvents {
  /** "demo" when there is no key (sample events only), otherwise "key". */
  readonly mode: "demo" | "key";
  readonly baseUrl: string;

  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly maxRetryDelayMs: number;

  constructor(options: TimTimEventsOptions = {}) {
    const apiKey = typeof options.apiKey === "string" && options.apiKey.trim() !== "" ? options.apiKey.trim() : undefined;
    if (apiKey && isServerOnlyKey(apiKey) && inBrowser()) {
      throw new TimTimError(
        "secret_key_in_browser",
        "This is a server key (tt_sk_live_…) or access token (tt_at_…). It must never be used in a browser — anyone could copy it. " +
          "Use a website key (tt_pk_live_…) here, or call TimTim.Live from your server.",
      );
    }
    const f = options.fetch ?? (globalThis as { fetch?: typeof fetch }).fetch;
    if (typeof f !== "function") {
      throw new TimTimError("fetch_unavailable", "No fetch() here. Use Node 18+, a modern browser, Deno or Bun — or pass { fetch } to TimTimEvents.");
    }
    this.apiKey = apiKey;
    this.mode = apiKey ? "key" : "demo";
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    /* Calling a browser's fetch detached from window throws "Illegal invocation". */
    this.fetchImpl = options.fetch ? options.fetch : (f.bind(globalThis) as typeof fetch);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = Math.min(5, Math.max(0, Math.floor(options.retries ?? 0)));
    this.maxRetryDelayMs = Math.max(0, options.maxRetryDelayMs ?? 10_000);
  }

  /* ── Events ─────────────────────────────────────────────────────────────── */

  readonly events = {
    /**
     * One page of events (operation listEvents). With no key: sample events from
     * the demo endpoint (operation listDemoEvents), which accepts fewer filters.
     */
    list: async (params: ListEventsParams = {}): Promise<EventList> => {
      if (this.mode === "demo") {
        const unsupported = Object.keys(params).filter((k) => !DEMO_FILTERS.has(k) && params[k as keyof ListEventsParams] !== undefined);
        if (unsupported.length) throw this.keyRequired(`The filter "${unsupported.join('", "')}"`);
        return this.request<DemoEventList>("GET", "/demo/events", { query: params as Query, auth: false });
      }
      return this.request<EventList>("GET", "/events", { query: params as Query });
    },

    /** One event, even after it ended or was cancelled (operation getEvent). Needs a key. */
    get: async (id: string): Promise<EventResponse> => {
      this.requireKey("events.get()");
      return this.request<EventResponse>("GET", `/events/${encodeURIComponent(id)}`);
    },

    /**
     * Every page, one at a time, following `next` until it is null.
     *
     *   for await (const page of tt.events.iterate({ city: "Paris" })) {
     *     for (const event of page.events) console.log(event.name);
     *   }
     */
    iterate: (params: ListEventsParams = {}): AsyncIterableIterator<EventList> => this.pages(params),

    /**
     * Everything that changed after `since` — including events that ended, were
     * cancelled, or were withdrawn (see `withdrawn`). Needs a key.
     */
    changedSince: async (since: string | Date, params: Omit<ListEventsParams, "changed_since"> = {}): Promise<EventList> => {
      this.requireKey("events.changedSince()");
      const changed_since = since instanceof Date ? since.toISOString() : since;
      return this.request<EventList>("GET", "/events", { query: { ...params, changed_since } as Query });
    },
  };

  private async *pages(params: ListEventsParams): AsyncIterableIterator<EventList> {
    let cursor = params.cursor;
    for (;;) {
      const page = await this.events.list({ ...params, cursor });
      yield page;
      if (!page.next || page.next === cursor) return;
      cursor = page.next;
    }
  }

  /* ── What you can ask for ────────────────────────────────────────────────── */

  readonly categories = {
    /**
     * The categories that have upcoming events for this key, with counts
     * (operation listCategories). With no key: counted from sample events.
     */
    list: async (params: ListCategoriesParams = {}): Promise<CategoryList> =>
      this.mode === "demo"
        ? this.request<DemoCategoryList>("GET", "/demo/categories", { query: params as Query, auth: false })
        : this.request<CategoryList>("GET", "/categories", { query: params as Query }),
  };

  readonly locations = {
    /** The cities that have upcoming events for this key, with counts (operation listLocations). With no key: sample events. */
    list: async (params: ListLocationsParams = {}): Promise<LocationList> =>
      this.mode === "demo"
        ? this.request<DemoLocationList>("GET", "/demo/locations", { query: params as Query, auth: false })
        : this.request<LocationList>("GET", "/locations", { query: params as Query }),
  };

  /* ── Demo (no key, ever) ─────────────────────────────────────────────────── */

  readonly demo = {
    events: {
      /**
       * Sample events with no key (operation listDemoEvents). Add `simulate` to
       * see a bad day: sold_out, cancelled, rescheduled, postponed — or the exact
       * problem a real key would get: invalid_key (401), rate_limited (429).
       */
      list: async (params: ListDemoEventsParams = {}): Promise<DemoEventList> =>
        this.request<DemoEventList>("GET", "/demo/events", { query: params as Query, auth: false }),
    },
    categories: {
      list: async (params: ListCategoriesParams = {}): Promise<DemoCategoryList> =>
        this.request<DemoCategoryList>("GET", "/demo/categories", { query: params as Query, auth: false }),
    },
    locations: {
      list: async (params: ListLocationsParams = {}): Promise<DemoLocationList> =>
        this.request<DemoLocationList>("GET", "/demo/locations", { query: params as Query, auth: false }),
    },
  };

  /* ── Tracking (operation track) ──────────────────────────────────────────── */

  /**
   * Tell TimTim.Live what your page showed or a visitor clicked, so your
   * dashboard can count it: `impression`, `event_view` or `event_click`. Never
   * money — sales are recorded by TimTim.Live itself. Your website or test key
   * is added for you (never a server key). Fire-and-forget: it never throws and
   * resolves true when the signal was handed to the browser or answered 204.
   */
  async track(signal: Omit<TrackSignal, "key">): Promise<boolean> {
    const key = this.apiKey && (this.apiKey.startsWith("tt_pk_live_") || this.apiKey.startsWith("tt_test_")) ? this.apiKey : undefined;
    /* text/plain keeps it a "simple" request: no preflight, and sendBeacon can carry it as the page closes. */
    const payload = JSON.stringify({ ...signal, ...(key ? { key } : {}) });
    const url = `${this.baseUrl}/track`;
    try {
      const nav = (globalThis as { navigator?: { sendBeacon?: (u: string, d: Blob | string) => boolean } }).navigator;
      if (nav?.sendBeacon && typeof Blob === "function" && nav.sendBeacon(url, new Blob([payload], { type: "text/plain" }))) return true;
      const response = await this.fetchImpl(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: payload, keepalive: true } as RequestInit);
      return response.status === 204;
    } catch {
      return false;
    }
  }

  /* ── Embedded commerce (server keys or test keys) ───────────────────────── */

  readonly tickets = {
    /** Paid ticket types on sale for one event (operation listTicketTypes). */
    list: async (eventId: string): Promise<TicketTypeList> => {
      this.requireKey("tickets.list()");
      return this.request<TicketTypeList>("GET", `/events/${encodeURIComponent(eventId)}/tickets`);
    },
  };

  readonly orders = {
    /**
     * Hold tickets and get TimTim.Live's payment link (operation createOrder).
     * The same idempotencyKey always returns the same order — never a second hold.
     */
    create: async (body: CreateOrderBody, options: { idempotencyKey: string }): Promise<Order> => {
      this.requireKey("orders.create()");
      const idem = options?.idempotencyKey;
      if (typeof idem !== "string" || !IDEMPOTENCY_KEY.test(idem)) {
        throw new TimTimError("invalid_argument", "orders.create() needs { idempotencyKey }: 8–80 letters, digits, _ or -. Reuse it when you retry the same order.");
      }
      return this.request<Order>("POST", "/orders", { body, headers: { "Idempotency-Key": idem } });
    },
    /** The status of an order your company began (operation getOrder). */
    get: async (id: string): Promise<Order> => {
      this.requireKey("orders.get()");
      return this.request<Order>("GET", `/orders/${encodeURIComponent(id)}`);
    },
  };

  /* ── Your results ────────────────────────────────────────────────────────── */

  readonly earnings = {
    /** Sales through your buy links and what they earned (operation listEarnings). The contract defines no filters. */
    list: async (): Promise<EarningList> => {
      this.requireKey("earnings.list()");
      return this.request<EarningList>("GET", "/earnings");
    },
  };

  readonly offers = {
    /** Card-linked offers (operation listOffers). Enterprise; server keys or test keys. */
    list: async (params: ListOffersParams = {}): Promise<OfferList> => {
      this.requireKey("offers.list()");
      return this.request<OfferList>("GET", "/offers", { query: params as Query });
    },
  };

  readonly settlements = {
    /** Your monthly statements (operation listSettlements). Read only. The contract defines no filters. */
    list: async (): Promise<SettlementList> => {
      this.requireKey("settlements.list()");
      return this.request<SettlementList>("GET", "/settlements");
    },
  };

  /* ── Feeds ───────────────────────────────────────────────────────────────── */

  readonly feeds = {
    /**
     * The address of a feed (operation eventFeed) for a feed reader or calendar,
     * which cannot send headers — so the key goes in the URL. Only a website key
     * (tt_pk_live_…) or a test key (tt_test_…) may; a server key never may.
     * Builds a string; makes no request.
     */
    url: (format: FeedFormat, params: FeedParams = {}): string => {
      const key = this.requireKey("feeds.url()");
      if (!(key.startsWith("tt_pk_live_") || key.startsWith("tt_test_"))) {
        throw new TimTimError(
          "key_not_allowed_in_url",
          "Only a website key (tt_pk_live_…) or a test key (tt_test_…) may go in a feed URL. A server key in a URL would leak — TimTim.Live refuses it.",
        );
      }
      if (!["json", "rss", "xml", "csv", "ics"].includes(format)) {
        throw new TimTimError("invalid_argument", `feeds.url(): format must be json, rss, xml, csv or ics (got "${String(format)}").`);
      }
      return `${this.baseUrl}/feeds/events.${format}${toQueryString({ key, ...params } as Query)}`;
    },
  };

  /* ── Plumbing ────────────────────────────────────────────────────────────── */

  private keyRequired(what: string): TimTimError {
    return new TimTimError(
      "key_required",
      `${what} needs an API key. Get a free test key (tt_test_…) at ${DASHBOARD}, then: new TimTimEvents({ apiKey }). ` +
        "With no key you can still list sample events: events.list() or demo.events.list().",
    );
  }

  private requireKey(what: string): string {
    if (!this.apiKey) throw this.keyRequired(what);
    return this.apiKey;
  }

  /** One request, retried per `retries` when it is a GET and trying again can help. */
  private async request<T>(
    method: "GET" | "POST",
    path: string,
    options: { query?: Query; body?: unknown; headers?: Record<string, string>; auth?: boolean } = {},
  ): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.requestOnce<T>(method, path, options);
      } catch (error) {
        if (method !== "GET" || attempt >= this.retries || !(error instanceof TimTimError)) throw error;
        const api = error instanceof TimTimApiError ? error : null;
        const retryable = api ? RETRY_STATUSES.has(api.status) : error.code === "network_error" || error.code === "timeout";
        if (!retryable) throw error;
        const wait = retryDelayMs(attempt, api ? api.retryAfter : null, this.maxRetryDelayMs);
        if (wait === null) throw error;
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  private async requestOnce<T>(
    method: "GET" | "POST",
    path: string,
    options: { query?: Query; body?: unknown; headers?: Record<string, string>; auth?: boolean } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}${toQueryString(options.query)}`;
    /* Only CORS-safelisted headers when there is no key, so the demo works from any website without a preflight. */
    const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
    if (options.auth !== false && this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    let payload: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(options.body);
    }

    const controller = typeof AbortController === "function" ? new AbortController() : undefined;
    let timedOut = false;
    const timer = controller
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, this.timeoutMs)
      : undefined;

    let response: Response;
    let text: string;
    try {
      response = await this.fetchImpl(url, { method, headers, body: payload, signal: controller?.signal });
      text = await response.text();
    } catch (cause) {
      if (timedOut) throw new TimTimError("timeout", `TimTim.Live did not answer within ${this.timeoutMs} ms (${method} ${path}).`, { cause });
      throw new TimTimError("network_error", `Could not reach TimTim.Live (${method} ${path}): ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }

    let body: unknown = undefined;
    if (text !== "") {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
    }
    if (!response.ok) throw apiErrorFrom(response, body);
    if (body === undefined) {
      throw new TimTimError("invalid_response", `TimTim.Live answered ${response.status} but not with JSON (${method} ${path}).`);
    }
    return body as T;
  }
}
