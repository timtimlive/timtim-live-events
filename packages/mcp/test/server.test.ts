import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Event } from "@timtim-live/events";
import { createServer } from "../src/index.js";

const EVENT: Event = {
  id: "evt_test_miami_konpa",
  name: "TEST EVENT — NO REAL MONEY · Miami Konpa Live",
  status: "cancelled",
  starts_at: null,
  ends_at: null,
  date: "2026-10-14",
  timezone: null,
  location: { venue: "Sample Waterfront Stage", address: null, city: "Miami", country: "US", lat: 25.77, lng: -80.19 },
  image: null,
  category: "music",
  performers: [],
  tickets: { from: 30, to: 60, currency: "USD", availability: "ended", buy_url: "https://timtim.live/b/abc123" },
  earn: { eligible: false },
  can_share: true,
  url: "https://timtim.live/events/miami-konpa",
  display: { short_description: null, date_label: "Wed, Oct 14 · 8:00 PM", price_label: "From $30" },
  organizer: { name: "TimTim.Live Sandbox", verified: false },
  test: true,
  updated_at: "2026-10-07T00:00:00.000Z",
  inventory_updated_at: null,
};

type Call = { url: string; auth: string | null };

async function connect(options: { apiKey?: string; respond?: (url: string) => Response } = {}) {
  const calls: Call[] = [];
  const respond = options.respond ?? (() => Response.json({ object: "list", mode: "test", events: [EVENT], next: null }));
  const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), auth: new Headers(init.headers as HeadersInit).get("Authorization") });
    return respond(String(input));
  }) as typeof fetch;
  const server = createServer({ apiKey: options.apiKey, fetch: fetchImpl });
  const client = new Client({ name: "test", version: "1.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return { client, calls };
}

const text = (r: unknown) => ((r as { content: Array<{ text: string }> }).content[0].text);

describe("@timtim-live/mcp", () => {
  it("offers exactly six read-only tools", async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(["find_events", "find_events_near_location", "find_events_by_category", "get_event", "list_categories", "list_locations"]);
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint).toBe(true);
      expect(t.annotations?.destructiveHint).toBe(false);
    }
  });

  it("finds sample events with no key, says SAMPLE, and keeps id, status, page and ticket link", async () => {
    const { client, calls } = await connect();
    const r = await client.callTool({ name: "find_events", arguments: { city: "Miami", category: "Music", country: "us" } });
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe("/v1/demo/events");
    expect(Object.fromEntries(url.searchParams)).toEqual({ city: "Miami", category: "music", country: "US", limit: "10" });
    expect(calls[0].auth).toBeNull();
    const t = text(r);
    expect(t.startsWith("SAMPLE DATA")).toBe(true);
    for (const part of ["evt_test_miami_konpa", "[CANCELLED]", "https://timtim.live/events/miami-konpa", "https://timtim.live/b/abc123"]) expect(t).toContain(part);
  });

  it("uses /events with the key when one is given", async () => {
    const { client, calls } = await connect({ apiKey: "tt_test_example_key" });
    await client.callTool({ name: "find_events_near_location", arguments: { latitude: 38.9, longitude: -77 } });
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe("/v1/events");
    expect(Object.fromEntries(url.searchParams)).toEqual({ lat: "38.9", lng: "-77", radius: "50", limit: "10" });
    expect(calls[0].auth).toBe("Bearer tt_test_example_key");
  });

  it("refuses bad arguments before calling anybody", async () => {
    const { client, calls } = await connect();
    const r = await client.callTool({ name: "find_events", arguments: { country: "USA" } });
    expect(r.isError).toBe(true);
    const near = await client.callTool({ name: "find_events_near_location", arguments: { latitude: 120, longitude: 0 } });
    expect(near.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("turns an API problem into words the assistant can read", async () => {
    const problem = { type: "x", title: "Too many requests — please slow down.", status: 429, detail: "Wait 30 seconds.", request_id: "req_1", code: "rate_limited" };
    const { client } = await connect({ respond: () => new Response(JSON.stringify(problem), { status: 429, headers: { "Content-Type": "application/problem+json", "Retry-After": "30" } }) });
    const r = await client.callTool({ name: "find_events", arguments: {} });
    expect(r.isError).toBe(true);
    expect(text(r)).toContain("Too many requests");
  });

  it("gets one event: by id with a key, from the sample list without one", async () => {
    const keyed = await connect({ apiKey: "tt_test_example_key", respond: () => Response.json({ object: "event", mode: "test", event: EVENT }) });
    const r = await keyed.client.callTool({ name: "get_event", arguments: { id: EVENT.id } });
    expect(new URL(keyed.calls[0].url).pathname).toBe(`/v1/events/${EVENT.id}`);
    expect(text(r)).toContain("Miami Konpa Live");
    const keyless = await connect();
    const missing = await keyless.client.callTool({ name: "get_event", arguments: { id: "evt_nope" } });
    expect(missing.isError).toBe(true);
  });

  it("lists categories and cities", async () => {
    const { client, calls } = await connect({
      respond: (url) => Response.json(url.includes("categor") ? { object: "list", mode: "test", categories: [{ id: "music", events: 4 }] } : { object: "list", mode: "test", locations: [{ city: "Paris", country: "FR", events: 2 }] }),
    });
    expect(text(await client.callTool({ name: "list_categories", arguments: {} }))).toContain("music: 4");
    expect(text(await client.callTool({ name: "list_locations", arguments: { country: "fr" } }))).toContain("Paris, FR: 2");
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual(["/v1/demo/categories", "/v1/demo/locations"]);
  });
});
