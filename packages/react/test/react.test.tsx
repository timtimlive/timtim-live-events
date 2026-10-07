import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { Event } from "@timtim-live/events";
import { TimTimEvents, TimTimProvider, useTimTimEvents } from "../src/index.js";

const EVENT: Event = {
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
  earn: { eligible: true },
  can_share: true,
  url: "https://timtim.live/partners/docs#sandbox",
  display: { short_description: null, date_label: "Wed, Oct 14 · 8:00 PM", price_label: "From $30" },
  organizer: { name: "TimTim.Live Sandbox", verified: false },
  test: true,
  updated_at: "2026-10-07T00:00:00.000Z",
  inventory_updated_at: null,
};

let calls: { url: string; init: RequestInit }[] = [];
let respond: (url: string) => Response;
const page = (events: Event[]) => new Response(JSON.stringify({ object: "list", mode: "test", events, next: null }), { headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  calls = [];
  respond = () => page([EVENT]);
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return respond(String(input));
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const auth = (i: number) => new Headers(calls[i].init.headers as HeadersInit).get("Authorization");

describe("<TimTimEvents>", () => {
  it("shows sample events from the keyless demo endpoint", async () => {
    render(<TimTimEvents city="Miami" category="music" />);
    expect(screen.getByText("Loading events…")).toBeTruthy();
    const list = await screen.findByRole("list", { name: "Events" });
    expect(list.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: EVENT.name })).toBeTruthy();
    expect(screen.getByText("Sample — no real money")).toBeTruthy();
    const link = screen.getByRole("link", { name: `Get tickets: ${EVENT.name}` }) as HTMLAnchorElement;
    expect(link.href).toBe(EVENT.tickets.buy_url);
    expect(calls[0].url).toBe("https://api.timtim.live/v1/demo/events?city=Miami&category=music");
    expect(auth(0)).toBeNull();
  });

  it("keeps a hostile name as text and drops http links", async () => {
    const evil = `<img src=x onerror="alert(1)">`;
    respond = () => page([{ ...EVENT, name: evil, image: "http://insecure.example.com/a.jpg", tickets: { ...EVENT.tickets, buy_url: "http://insecure.example.com/buy" } }]);
    const { container } = render(<TimTimEvents city="Miami" />);
    await screen.findByRole("heading", { name: evil });
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("hands everything to render() when given", async () => {
    render(<TimTimEvents city="Miami" render={({ events, loading }) => (loading ? <i>wait</i> : <b data-testid="n">{events.length}</b>)} />);
    expect((await screen.findByTestId("n")).textContent).toBe("1");
  });

  it("shows an error with a named retry button", async () => {
    respond = () => new Response(JSON.stringify({ type: "about:blank", title: "Slow down.", status: 429, detail: "", request_id: "req_x", code: "rate_limited" }), { status: 429 });
    render(<TimTimEvents city="Miami" simulate="rate_limited" />);
    expect((await screen.findByRole("alert")).textContent).toBe("We could not load events right now.");
    respond = () => page([EVENT]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("list");
    expect(calls).toHaveLength(2);
    expect(new URL(calls[0].url).searchParams.get("simulate")).toBe("rate_limited");
  });

  it("shows an empty state", async () => {
    respond = () => page([]);
    render(<TimTimEvents city="Nowhere" />);
    expect(await screen.findByText("No events here yet.")).toBeTruthy();
  });
});

describe("TimTimProvider + useTimTimEvents", () => {
  it("uses the provider's key for /events", async () => {
    const { result } = renderHook(() => useTimTimEvents({ city: "Washington" }), {
      wrapper: ({ children }) => <TimTimProvider apiKey="tt_pk_live_example_key">{children}</TimTimProvider>,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events[0].id).toBe(EVENT.id);
    expect(new URL(calls[0].url).pathname).toBe("/v1/events");
    expect(auth(0)).toBe("Bearer tt_pk_live_example_key");
  });

  it("refuses a server key in the browser and reports it as the error, never sending it", async () => {
    const { result } = renderHook(() => useTimTimEvents({ city: "Washington" }), {
      wrapper: ({ children }) => <TimTimProvider apiKey="tt_sk_live_example_key">{children}</TimTimProvider>,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect((result.current.error as { code?: string }).code).toBe("secret_key_in_browser");
    expect(calls).toHaveLength(0);
  });

  it("re-fetches when the filters change", async () => {
    const { result, rerender } = renderHook(({ city }) => useTimTimEvents({ city }), { initialProps: { city: "Miami" } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ city: "Paris" });
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(new URL(calls[1].url).searchParams.get("city")).toBe("Paris");
  });

  it("does nothing while enabled is false", async () => {
    const { result } = renderHook(() => useTimTimEvents({ city: "Miami" }, { enabled: false }));
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});
