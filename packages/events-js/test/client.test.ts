import { afterEach, describe, expect, it } from "vitest";
import { TimTimApiError, TimTimError, TimTimEvents, toQueryString, parseRetryAfter } from "../src/index.js";
import { SAMPLE_EVENT, headersOf, json, list, mockFetch, problem } from "./helpers.js";

const TEST_KEY = "tt_test_example_key";
const PK_KEY = "tt_pk_live_example_key";
const SK_KEY = "tt_sk_live_example_key";
const BASE = "https://api.timtim.live/v1";

async function rejection(p: Promise<unknown> | (() => unknown)): Promise<TimTimError> {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    return e as TimTimError;
  }
  throw new Error("expected a rejection");
}

describe("demo mode (no key)", () => {
  it("lists sample events from /demo/events without an Authorization header", async () => {
    const { fn, calls } = mockFetch(() => json(list([SAMPLE_EVENT])));
    const tt = new TimTimEvents({ fetch: fn });
    expect(tt.mode).toBe("demo");
    const page = await tt.events.list({ city: "Miami", category: "music" });
    expect(page.events[0].name).toMatch(/^TEST EVENT — NO REAL MONEY/);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${BASE}/demo/events?city=Miami&category=music`);
    expect(calls[0].init.method).toBe("GET");
    expect(headersOf(calls[0]).get("Authorization")).toBeNull();
    expect(headersOf(calls[0]).get("Accept")).toBe("application/json");
  });

  it("refuses filters the demo endpoint does not have, saying a key is needed", async () => {
    const { fn, calls } = mockFetch(() => json(list([])));
    const tt = new TimTimEvents({ fetch: fn });
    const err = await rejection(tt.events.list({ commissioned: true }));
    expect(err).toBeInstanceOf(TimTimError);
    expect(err.code).toBe("key_required");
    expect(err.message).toContain("commissioned");
    expect(err.message).toContain("https://timtim.live/partners/dashboard");
    expect(calls).toHaveLength(0);
  });

  it.each([
    ["events.get", (tt: TimTimEvents) => tt.events.get("evt_test_miami_konpa")],
    ["events.changedSince", (tt: TimTimEvents) => tt.events.changedSince("2026-10-01T00:00:00Z")],
    ["tickets.list", (tt: TimTimEvents) => tt.tickets.list("evt_test_miami_konpa")],
    ["orders.create", (tt: TimTimEvents) => tt.orders.create({ event_id: "e", ticket_type_id: "t", buyer_email: "buyer@example.com", buyer_name: "A Buyer" }, { idempotencyKey: "order-0001" })],
    ["orders.get", (tt: TimTimEvents) => tt.orders.get("ord_1")],
    ["earnings.list", (tt: TimTimEvents) => tt.earnings.list()],
    ["offers.list", (tt: TimTimEvents) => tt.offers.list()],
    ["settlements.list", (tt: TimTimEvents) => tt.settlements.list()],
    ["feeds.url", (tt: TimTimEvents) => tt.feeds.url("rss")],
  ])("%s needs a key", async (name, call) => {
    const { fn, calls } = mockFetch(() => json({}));
    const tt = new TimTimEvents({ fetch: fn });
    const err = await rejection(() => call(tt));
    expect(err.code).toBe("key_required");
    expect(err.message).toContain(name.split(".")[0]);
    expect(calls).toHaveLength(0);
  });

  it("iterates demo pages too", async () => {
    const { fn, calls } = mockFetch((_u, _i, n) => json(list([SAMPLE_EVENT], n === 1 ? "c2" : null)));
    const tt = new TimTimEvents({ fetch: fn });
    const pages = [];
    for await (const page of tt.events.iterate({ city: "Miami" })) pages.push(page);
    expect(pages).toHaveLength(2);
    expect(calls[1].url).toBe(`${BASE}/demo/events?city=Miami&cursor=c2`);
  });
});

describe("with a key", () => {
  it("lists events from /events with a Bearer key", async () => {
    const { fn, calls } = mockFetch(() => json(list([SAMPLE_EVENT])));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    expect(tt.mode).toBe("key");
    await tt.events.list({ city: "Washington" });
    expect(calls[0].url).toBe(`${BASE}/events?city=Washington`);
    expect(headersOf(calls[0]).get("Authorization")).toBe(`Bearer ${TEST_KEY}`);
  });

  it("encodes the query safely and leaves out empty values", async () => {
    const { fn, calls } = mockFetch(() => json(list([])));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    await tt.events.list({ city: "São Paulo", artist: "R&B = soul?", commissioned: true, limit: 5, lat: 48.85, category: undefined, near: "" });
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe("/v1/events");
    expect(url.searchParams.get("city")).toBe("São Paulo");
    expect(url.searchParams.get("artist")).toBe("R&B = soul?");
    expect(url.searchParams.get("commissioned")).toBe("true");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("lat")).toBe("48.85");
    expect(url.searchParams.has("category")).toBe(false);
    expect(url.searchParams.has("near")).toBe(false);
    expect(calls[0].url).not.toContain(" ");
    expect(calls[0].url).toContain("artist=R%26B+%3D+soul%3F");
  });

  it("gets one event and encodes the id into the path", async () => {
    const { fn, calls } = mockFetch(() => json({ object: "event", mode: "test", event: SAMPLE_EVENT }));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    const res = await tt.events.get("evt/../x?y");
    expect(res.event.id).toBe(SAMPLE_EVENT.id);
    expect(calls[0].url).toBe(`${BASE}/events/evt%2F..%2Fx%3Fy`);
  });

  it("iterates every page by passing next as cursor, and stops at null", async () => {
    const pages: Record<string, unknown> = { "": list([SAMPLE_EVENT], "p2"), p2: list([SAMPLE_EVENT], "p3"), p3: list([SAMPLE_EVENT], null) };
    const { fn, calls } = mockFetch((u) => json(pages[new URL(u).searchParams.get("cursor") ?? ""]));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    let n = 0;
    for await (const page of tt.events.iterate({ city: "Paris", limit: 1 })) {
      n++;
      expect(page.events).toHaveLength(1);
    }
    expect(n).toBe(3);
    expect(calls.map((c) => new URL(c.url).searchParams.get("cursor"))).toEqual([null, "p2", "p3"]);
    expect(calls.every((c) => new URL(c.url).searchParams.get("city") === "Paris")).toBe(true);
  });

  it("stops iterating if the server repeats a cursor (never loops forever)", async () => {
    const { fn, calls } = mockFetch(() => json(list([], "same")));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    for await (const _ of tt.events.iterate()) void _;
    expect(calls).toHaveLength(2);
  });

  it("changedSince sends changed_since (Date or string) and returns withdrawn", async () => {
    const { fn, calls } = mockFetch(() => json({ ...list([SAMPLE_EVENT]), withdrawn: [{ id: "evt_gone", withdrawn_at: "2026-10-06T00:00:00Z" }] }));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    const res = await tt.events.changedSince(new Date("2026-10-06T10:00:00Z"), { country: "US" });
    expect(new URL(calls[0].url).searchParams.get("changed_since")).toBe("2026-10-06T10:00:00.000Z");
    expect(new URL(calls[0].url).searchParams.get("country")).toBe("US");
    expect(res.withdrawn?.[0].id).toBe("evt_gone");
    await tt.events.changedSince("2026-10-06T10:00:00Z");
    expect(new URL(calls[1].url).searchParams.get("changed_since")).toBe("2026-10-06T10:00:00Z");
  });

  it("demo.events.list never sends the key, and passes simulate", async () => {
    const { fn, calls } = mockFetch(() => json(list([{ ...SAMPLE_EVENT, status: "cancelled" }])));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    const res = await tt.demo.events.list({ city: "Miami", simulate: "cancelled" });
    expect(res.events[0].status).toBe("cancelled");
    expect(calls[0].url).toBe(`${BASE}/demo/events?city=Miami&simulate=cancelled`);
    expect(headersOf(calls[0]).get("Authorization")).toBeNull();
  });

  it("categories and locations use the keyed paths with a key, the demo paths without", async () => {
    const { fn, calls } = mockFetch((url) => json(url.includes("categor") ? { object: "list", mode: "test", categories: [{ id: "music", events: 3 }] } : { object: "list", mode: "test", locations: [{ city: "Miami", country: "US", events: 2 }] }));
    const keyed = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    expect((await keyed.categories.list({ country: "US" })).categories[0]).toEqual({ id: "music", events: 3 });
    expect((await keyed.locations.list({ limit: 5 })).locations[0].city).toBe("Miami");
    const keyless = new TimTimEvents({ fetch: fn });
    await keyless.categories.list();
    await keyless.demo.locations.list({ country: "US" });
    expect(calls.map((c) => c.url)).toEqual([`${BASE}/categories?country=US`, `${BASE}/locations?limit=5`, `${BASE}/demo/categories`, `${BASE}/demo/locations?country=US`]);
    expect(headersOf(calls[0]).get("Authorization")).toBe(`Bearer ${TEST_KEY}`);
    expect(headersOf(calls[2]).get("Authorization")).toBeNull();
  });

  it("track() posts a text/plain signal with the public key, and never throws", async () => {
    const { fn, calls } = mockFetch(() => new Response(null, { status: 204 }));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    expect(await tt.track({ type: "event_click", event_id: "evt_1", view: "pv_12345678" })).toBe(true);
    expect(calls[0].url).toBe(`${BASE}/track`);
    expect(calls[0].init.method).toBe("POST");
    expect(headersOf(calls[0]).get("Content-Type")).toBe("text/plain");
    expect(headersOf(calls[0]).get("Authorization")).toBeNull();
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ type: "event_click", event_id: "evt_1", view: "pv_12345678", key: TEST_KEY });
    const broken = new TimTimEvents({ fetch: (async () => { throw new Error("offline"); }) as typeof fetch });
    expect(await broken.track({ type: "impression" })).toBe(false);
  });

  it("tickets.list calls /events/{id}/tickets", async () => {
    const { fn, calls } = mockFetch(() => json({ object: "list", mode: "test", event_id: "evt_test_miami_konpa", ticket_types: [] }));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    await tt.tickets.list("evt_test_miami_konpa");
    expect(calls[0].url).toBe(`${BASE}/events/evt_test_miami_konpa/tickets`);
  });

  it("orders.create POSTs JSON with the Idempotency-Key header", async () => {
    const order = { object: "order", id: "ord_test_1", event_id: "evt_test_miami_konpa", quantity: 2, total: 60, currency: "USD", status: "test", sub_id: "click-42", created_at: "2026-10-07T00:00:00Z", test: true };
    const { fn, calls } = mockFetch(() => json(order));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    const body = { event_id: "evt_test_miami_konpa", ticket_type_id: "tt_test_miami_konpa", quantity: 2, buyer_email: "buyer@example.com", buyer_name: "A Buyer", sub_id: "click-42" };
    const res = await tt.orders.create(body, { idempotencyKey: "order-2026-10-07-0001" });
    expect(res.id).toBe("ord_test_1");
    expect(calls[0].url).toBe(`${BASE}/orders`);
    expect(calls[0].init.method).toBe("POST");
    expect(headersOf(calls[0]).get("Idempotency-Key")).toBe("order-2026-10-07-0001");
    expect(headersOf(calls[0]).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(calls[0].init.body))).toEqual(body);
  });

  it.each(["", "short", "has space here", "x".repeat(81), "bad/char!"])("orders.create refuses the idempotency key %j without calling the API", async (idem) => {
    const { fn, calls } = mockFetch(() => json({}));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    const err = await rejection(tt.orders.create({ event_id: "e", ticket_type_id: "t", buyer_email: "buyer@example.com", buyer_name: "B" }, { idempotencyKey: idem }));
    expect(err.code).toBe("invalid_argument");
    expect(calls).toHaveLength(0);
  });

  it("orders.get, earnings.list, offers.list, settlements.list hit the contract's paths", async () => {
    const { fn, calls } = mockFetch(() => json({}));
    const tt = new TimTimEvents({ apiKey: SK_KEY, fetch: fn });
    await tt.orders.get("ord_1");
    await tt.earnings.list();
    await tt.offers.list({ country: "US", limit: 10 });
    await tt.settlements.list();
    expect(calls.map((c) => c.url)).toEqual([`${BASE}/orders/ord_1`, `${BASE}/earnings`, `${BASE}/offers?country=US&limit=10`, `${BASE}/settlements`]);
    expect(calls.every((c) => headersOf(c).get("Authorization") === `Bearer ${SK_KEY}`)).toBe(true);
  });

  it("uses a custom baseUrl and strips a trailing slash", async () => {
    const { fn, calls } = mockFetch(() => json(list([])));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn, baseUrl: "https://timtim.live/v1/" });
    await tt.events.list();
    expect(calls[0].url).toBe("https://timtim.live/v1/events");
  });
});

describe("feeds.url", () => {
  it("builds the feed address with a test or website key in ?key=", () => {
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: mockFetch(() => json({})).fn });
    expect(tt.feeds.url("rss", { city: "Paris", limit: 5 })).toBe(`${BASE}/feeds/events.rss?key=${TEST_KEY}&city=Paris&limit=5`);
    const pk = new TimTimEvents({ apiKey: PK_KEY, fetch: mockFetch(() => json({})).fn });
    expect(pk.feeds.url("ics")).toBe(`${BASE}/feeds/events.ics?key=${PK_KEY}`);
  });

  it("refuses to put a server key in a URL", () => {
    const tt = new TimTimEvents({ apiKey: SK_KEY, fetch: mockFetch(() => json({})).fn });
    expect(() => tt.feeds.url("json")).toThrow(expect.objectContaining({ code: "key_not_allowed_in_url" }));
  });

  it("refuses a format the contract does not list", () => {
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: mockFetch(() => json({})).fn });
    expect(() => tt.feeds.url("html" as never)).toThrow(expect.objectContaining({ code: "invalid_argument" }));
  });
});

describe("errors", () => {
  it("turns a problem response into TimTimApiError with every field", async () => {
    const { fn } = mockFetch(() => problem(401, "invalid_key", { title: "That key is not valid.", detail: "Check the key." }));
    const tt = new TimTimEvents({ apiKey: TEST_KEY, fetch: fn });
    const err = (await rejection(tt.events.list())) as TimTimApiError;
    expect(err).toBeInstanceOf(TimTimApiError);
    expect(err).toBeInstanceOf(TimTimError);
    expect(err.status).toBe(401);
    expect(err.code).toBe("invalid_key");
    expect(err.title).toBe("That key is not valid.");
    expect(err.detail).toBe("Check the key.");
    expect(err.requestId).toBe("req_test123");
    expect(err.type).toBe("https://timtim.live/partners/docs#problem-invalid_key");
    expect(err.retryAfter).toBeNull();
    expect(err.message).toContain("req_test123");
  });

  it("reads Retry-After (seconds) on 429", async () => {
    const { fn } = mockFetch(() => problem(429, "rate_limited", {}, { "Retry-After": "30" }));
    const err = (await rejection(new TimTimEvents({ fetch: fn }).events.list())) as TimTimApiError;
    expect(err.status).toBe(429);
    expect(err.code).toBe("rate_limited");
    expect(err.retryAfter).toBe(30);
  });

  it("reads Retry-After as an HTTP date", () => {
    const now = Date.parse("2026-10-07T12:00:00Z");
    expect(parseRetryAfter("Wed, 07 Oct 2026 12:00:45 GMT", now)).toBe(45);
    expect(parseRetryAfter("Wed, 07 Oct 2026 11:00:00 GMT", now)).toBe(0);
    expect(parseRetryAfter("soon", now)).toBeNull();
    expect(parseRetryAfter(null, now)).toBeNull();
  });

  it("falls back to the TimTim-Request-Id header and http_<status> when the body is not a problem", async () => {
    const { fn } = mockFetch(() => new Response("<html>bad gateway</html>", { status: 502, statusText: "Bad Gateway", headers: { "TimTim-Request-Id": "req_hdr" } }));
    const err = (await rejection(new TimTimEvents({ fetch: fn }).events.list())) as TimTimApiError;
    expect(err.status).toBe(502);
    expect(err.code).toBe("http_502");
    expect(err.requestId).toBe("req_hdr");
    expect(err.title).toBe("Bad Gateway");
  });

  it("understands the OAuth error shape", async () => {
    const { fn } = mockFetch(() => json({ error: "invalid_client", error_description: "Unknown client.", request_id: "req_o" }, { status: 401 }));
    const err = (await rejection(new TimTimEvents({ apiKey: TEST_KEY, fetch: fn }).events.list())) as TimTimApiError;
    expect(err.code).toBe("invalid_client");
    expect(err.title).toBe("Unknown client.");
    expect(err.requestId).toBe("req_o");
  });

  it("wraps a network failure as TimTimError network_error", async () => {
    const fn = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const err = await rejection(new TimTimEvents({ fetch: fn }).events.list());
    expect(err.code).toBe("network_error");
    expect(err.message).toContain("fetch failed");
  });

  it("gives up after timeoutMs with code timeout", async () => {
    const fn = ((_u: unknown, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      })) as typeof fetch;
    const err = await rejection(new TimTimEvents({ fetch: fn, timeoutMs: 20 }).events.list());
    expect(err.code).toBe("timeout");
  });

  it("refuses a 200 that is not JSON", async () => {
    const { fn } = mockFetch(() => new Response("not json", { status: 200 }));
    const err = await rejection(new TimTimEvents({ fetch: fn }).events.list());
    expect(err.code).toBe("invalid_response");
  });
});

describe("server keys never run in a browser", () => {
  const g = globalThis as { window?: unknown };
  afterEach(() => {
    delete g.window;
  });

  it("throws for tt_sk_live_ when window exists", () => {
    g.window = {};
    expect(() => new TimTimEvents({ apiKey: SK_KEY, fetch: mockFetch(() => json({})).fn })).toThrow(expect.objectContaining({ code: "secret_key_in_browser" }));
  });

  it("throws for an OAuth access token (tt_at_) when window exists", () => {
    g.window = {};
    expect(() => new TimTimEvents({ apiKey: "tt_at_example_token", fetch: mockFetch(() => json({})).fn })).toThrow(expect.objectContaining({ code: "secret_key_in_browser" }));
  });

  it("allows website keys and test keys in a browser", () => {
    g.window = {};
    expect(new TimTimEvents({ apiKey: PK_KEY, fetch: mockFetch(() => json({})).fn }).mode).toBe("key");
    expect(new TimTimEvents({ apiKey: TEST_KEY, fetch: mockFetch(() => json({})).fn }).mode).toBe("key");
  });

  it("allows a server key on a server (no window)", () => {
    expect(typeof g.window).toBe("undefined");
    expect(new TimTimEvents({ apiKey: SK_KEY, fetch: mockFetch(() => json({})).fn }).mode).toBe("key");
  });
});

describe("toQueryString", () => {
  it("is empty for nothing", () => {
    expect(toQueryString()).toBe("");
    expect(toQueryString({ a: undefined, b: null, c: "" })).toBe("");
  });
});
