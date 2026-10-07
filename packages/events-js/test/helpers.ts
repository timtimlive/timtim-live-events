import type { Event } from "../src/index.js";

export type Call = { url: string; init: RequestInit };

/** A fetch that records every call and answers with `respond`. */
export function mockFetch(respond: (url: string, init: RequestInit, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return respond(url, init, calls.length);
  }) as typeof fetch;
  return { fn, calls };
}

export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

export function problem(status: number, code: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({
      type: `https://timtim.live/partners/docs#problem-${code}`,
      title: "Something to fix.",
      status,
      detail: "What to do about it.",
      request_id: "req_test123",
      code,
      ...extra,
    }),
    { status, headers: { "Content-Type": "application/problem+json", ...headers } },
  );
}

export function headersOf(call: Call): Headers {
  return new Headers(call.init.headers as HeadersInit);
}

/** A real sample event, as GET /v1/demo/events returned it. */
export const SAMPLE_EVENT: Event = {
  id: "evt_test_miami_konpa",
  name: "TEST EVENT — NO REAL MONEY · Miami Konpa Live",
  status: "scheduled",
  starts_at: null,
  ends_at: null,
  date: "2026-10-14",
  timezone: null,
  location: { venue: "Sample Waterfront Stage", address: null, city: "Miami", country: "US", lat: 25.7743, lng: -80.1937 },
  image: null,
  category: "music",
  performers: [{ name: "Sample Konpa Band" }],
  tickets: { from: 30, to: 60, currency: "USD", availability: "available", buy_url: "https://timtim.live/partners/demo#buy-evt_test_miami_konpa" },
  earn: { eligible: true, amount: 4, currency: "USD", description: "$4 per eligible ticket" },
  can_share: true,
  url: "https://timtim.live/partners/docs#sandbox",
  display: { short_description: "A sample concert.", date_label: "Wed, Oct 14 · 8:00 PM", price_label: "From $30" },
  organizer: { name: "TimTim.Live Sandbox", verified: false },
  test: true,
  updated_at: "2026-10-07T00:00:00.000Z",
  inventory_updated_at: "2026-10-07T00:00:00.000Z",
};

export function list(events: Event[], next: string | null = null) {
  return { object: "list", mode: "test", events, next } as const;
}
