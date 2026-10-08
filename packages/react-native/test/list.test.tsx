import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Event } from "@timtim-live/events";
import { opened } from "./react-native-stub.js";
import { TimTimEventList, priceText, ticketLink, DEFAULT_LABELS } from "../src/index.js";

const EVENT: Event = {
  id: "evt_test_miami_konpa",
  name: "TEST EVENT — NO REAL MONEY · Miami Konpa Live",
  status: "scheduled",
  starts_at: null,
  ends_at: null,
  date: "2026-10-14",
  timezone: null,
  location: { venue: "Sample Waterfront Stage", address: null, city: "Miami", country: "US", lat: 25.77, lng: -80.19 },
  image: "https://images.example.com/konpa.jpg",
  category: "music",
  performers: [],
  tickets: { from: 30, to: 60, currency: "USD", availability: "available", buy_url: "https://timtim.live/b/abc123" },
  earn: { eligible: false },
  can_share: true,
  url: "https://timtim.live/events/miami-konpa",
  display: { short_description: null, date_label: "Wed, Oct 14 · 8:00 PM", price_label: "From $30" },
  organizer: { name: "TimTim.Live Sandbox", verified: false },
  test: true,
  updated_at: "2026-10-07T00:00:00.000Z",
  inventory_updated_at: null,
};

let calls: Array<{ url: string; init: RequestInit }> = [];
let respond: (url: string) => Response;

beforeEach(() => {
  calls = [];
  opened.length = 0;
  respond = (url) => (url.endsWith("/track") ? new Response(null, { status: 204 }) : Response.json({ object: "list", mode: "test", events: [EVENT], next: null }));
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return respond(String(input));
  });
  /* React Native has no sendBeacon; take it away so the fetch fallback is what runs. */
  vi.stubGlobal("navigator", {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("<TimTimEventList>", () => {
  it("shows sample events with a sample badge, price and a named ticket button", async () => {
    render(<TimTimEventList location="Miami,US" category="music" />);
    await screen.findByText(EVENT.name);
    expect(screen.getByText("Sample — no real money")).toBeTruthy();
    expect(screen.getByText("From $30.00")).toBeTruthy();
    expect(screen.getByText("Wed, Oct 14 · 8:00 PM · Sample Waterfront Stage, Miami")).toBeTruthy();
    expect(screen.getByRole("link", { name: `Get tickets: ${EVENT.name}` })).toBeTruthy();
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe("/v1/demo/events");
    expect(Object.fromEntries(url.searchParams)).toEqual({ city: "Miami", country: "US", category: "music", limit: "10" });
  });

  it("opens the ticket link exactly as given and counts the tap", async () => {
    render(<TimTimEventList city="Miami" apiKey="tt_test_example_key" />);
    fireEvent.click(await screen.findByRole("link", { name: `Get tickets: ${EVENT.name}` }));
    expect(opened).toEqual(["https://timtim.live/b/abc123"]);
    await waitFor(() => expect(calls.filter((c) => c.url.endsWith("/track"))).toHaveLength(2));
    const bodies = calls.filter((c) => c.url.endsWith("/track")).map((c) => JSON.parse(String(c.init.body)));
    expect(bodies.map((b) => b.type).sort()).toEqual(["event_click", "impression"]);
    expect(bodies.every((b) => b.key === "tt_test_example_key")).toBe(true);
  });

  it("has no ticket button for a cancelled event, and says so", async () => {
    respond = (url) => (url.endsWith("/track") ? new Response(null, { status: 204 }) : Response.json({ object: "list", mode: "test", events: [{ ...EVENT, status: "cancelled" }], next: null }));
    render(<TimTimEventList city="Miami" tracking={false} />);
    await screen.findByText("Cancelled");
    expect(screen.queryByRole("link")).toBeNull();
    expect(calls.some((c) => c.url.endsWith("/track"))).toBe(false);
  });

  it("refuses a server key and shows the error with a retry button", async () => {
    render(<TimTimEventList apiKey="tt_sk_live_example_key" />);
    await screen.findByText("We could not load events right now.");
    expect(screen.getByRole("button", { name: undefined })).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it("keeps only https links and images", () => {
    expect(ticketLink({ ...EVENT, tickets: { ...EVENT.tickets, buy_url: "http://insecure.example.com" } })).toBeNull();
    expect(ticketLink({ ...EVENT, tickets: { ...EVENT.tickets, availability: "sold_out" } })).toBeNull();
    expect(ticketLink(EVENT)).toBe("https://timtim.live/b/abc123");
    expect(priceText({ ...EVENT, tickets: { ...EVENT.tickets, from: 0 } }, DEFAULT_LABELS)).toBe("Free");
  });
});
