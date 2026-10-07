import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "@timtim-live/events";
import "../src/index.js";
import { safeHttpsUrl, type TimTimEventsElement } from "../src/index.js";

const EVENT: Event = {
  id: "evt_test_miami_konpa",
  name: "TEST EVENT — NO REAL MONEY · Miami Konpa Live",
  status: "scheduled",
  starts_at: null,
  ends_at: null,
  date: "2026-10-14",
  timezone: null,
  location: { venue: "Sample Waterfront Stage", address: null, city: "Miami", country: "US", lat: 25.7743, lng: -80.1937 },
  image: "https://images.example.com/konpa.jpg",
  category: "music",
  performers: [{ name: "Sample Konpa Band" }],
  tickets: { from: 30, to: 60, currency: "USD", availability: "available", buy_url: "https://timtim.live/partners/demo#buy-evt_test_miami_konpa" },
  earn: { eligible: true, amount: 4, currency: "USD" },
  can_share: true,
  url: "https://timtim.live/partners/docs#sandbox",
  display: { short_description: null, date_label: "Wed, Oct 14 · 8:00 PM", price_label: "From $30" },
  organizer: { name: "TimTim.Live Sandbox", verified: false },
  test: true,
  updated_at: "2026-10-07T00:00:00.000Z",
  inventory_updated_at: null,
};

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];
let respond: (url: string) => Response;

function page(events: Event[]) {
  return new Response(JSON.stringify({ object: "list", mode: "test", events, next: null }), { headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  calls = [];
  respond = () => page([EVENT]);
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return respond(String(input));
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mount(attrs: Record<string, string>): TimTimEventsElement {
  const node = document.createElement("timtim-events") as unknown as TimTimEventsElement;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  document.body.appendChild(node);
  return node;
}

const shadow = (node: Element) => node.shadowRoot as ShadowRoot;
async function settled(node: TimTimEventsElement) {
  await vi.waitFor(() => {
    const box = shadow(node).querySelector(".wrap");
    expect(box).not.toBeNull();
    expect(box!.hasAttribute("aria-busy")).toBe(false);
  });
}

describe("<timtim-events>", () => {
  it("is registered and renders sample events as an accessible list", async () => {
    expect(customElements.get("timtim-events")).toBeDefined();
    const node = mount({ city: "Miami", category: "music" });
    await settled(node);
    const root = shadow(node);
    const list = root.querySelector("ul")!;
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-label")).toBe("Events");
    const items = root.querySelectorAll("li");
    expect(items).toHaveLength(1);
    expect(root.querySelector(".name")!.textContent).toBe(EVENT.name);
    expect(root.querySelector(".badge")!.textContent).toBe("Sample — no real money");
    expect(root.querySelector(".meta")!.textContent).toBe("Wed, Oct 14 · 8:00 PM · Sample Waterfront Stage, Miami");
    expect(root.querySelector(".price")!.textContent).toBe("From $30.00");
    const buy = root.querySelector("a.buy") as HTMLAnchorElement;
    expect(buy.href).toBe(EVENT.tickets.buy_url);
    expect(buy.getAttribute("aria-label")).toBe(`Get tickets: ${EVENT.name}`);
    expect(buy.rel).toBe("noopener");
    expect((root.querySelector("img") as HTMLImageElement).src).toBe(EVENT.image);
  });

  it("calls the keyless demo endpoint with the attributes as filters", async () => {
    const node = mount({ city: "Miami", category: "music", limit: "3", country: "US" });
    await settled(node);
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.origin + url.pathname).toBe("https://api.timtim.live/v1/demo/events");
    expect(Object.fromEntries(url.searchParams)).toEqual({ city: "Miami", category: "music", country: "US", limit: "3" });
    expect(new Headers(calls[0].init.headers as HeadersInit).get("Authorization")).toBeNull();
  });

  it("keeps a hostile event name as plain text (no markup is ever created)", async () => {
    const evil = `<img src=x onerror="alert(1)"><script>alert(2)</script>`;
    respond = () => page([{ ...EVENT, name: evil, image: null, location: { ...EVENT.location, venue: "<b>bold</b>" } }]);
    const node = mount({ city: "Miami" });
    await settled(node);
    const root = shadow(node);
    expect(root.querySelector(".name")!.textContent).toBe(evil);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    expect(root.querySelectorAll("script")).toHaveLength(0);
    expect(root.querySelectorAll("b")).toHaveLength(0);
    expect(root.querySelector(".meta")!.textContent).toContain("<b>bold</b>");
  });

  it("refuses http and javascript: links and images", async () => {
    respond = () =>
      page([
        { ...EVENT, id: "a", image: "http://insecure.example.com/x.jpg", tickets: { ...EVENT.tickets, buy_url: "http://insecure.example.com/buy" } },
        { ...EVENT, id: "b", image: "javascript:alert(1)", tickets: { ...EVENT.tickets, buy_url: "javascript:alert(1)" } },
      ]);
    const node = mount({ city: "Miami" });
    await settled(node);
    const root = shadow(node);
    expect(root.querySelectorAll("li")).toHaveLength(2);
    expect(root.querySelectorAll("a.buy")).toHaveLength(0);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    expect(safeHttpsUrl("https://ok.example.com/")).toBe("https://ok.example.com/");
    expect(safeHttpsUrl("http://no.example.com/")).toBeNull();
    expect(safeHttpsUrl("//no.example.com/")).toBeNull();
  });

  it("shows status and no buy link for a cancelled or sold-out event", async () => {
    respond = () =>
      page([
        { ...EVENT, id: "c", status: "cancelled" },
        { ...EVENT, id: "s", tickets: { ...EVENT.tickets, availability: "sold_out" } },
      ]);
    const node = mount({ city: "Miami", simulate: "cancelled" });
    await settled(node);
    const root = shadow(node);
    expect(root.querySelector(".status")!.textContent).toBe("Cancelled");
    expect(root.querySelectorAll("a.buy")).toHaveLength(0);
    expect(new URL(calls[0].url).searchParams.get("simulate")).toBe("cancelled");
  });

  it("ignores an unknown simulate value", async () => {
    const node = mount({ city: "Miami", simulate: "<bogus>" });
    await settled(node);
    expect(new URL(calls[0].url).searchParams.has("simulate")).toBe(false);
  });

  it("re-fetches when an attribute changes", async () => {
    const node = mount({ city: "Miami" });
    await settled(node);
    node.setAttribute("city", "Paris");
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(new URL(calls[1].url).searchParams.get("city")).toBe("Paris");
  });

  it("uses /events with the key when a key is given", async () => {
    const node = mount({ city: "Washington", key: "tt_pk_live_example_key", simulate: "cancelled" });
    await settled(node);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe("/v1/events");
    expect(url.searchParams.has("simulate")).toBe(false);
    expect(new Headers(calls[0].init.headers as HeadersInit).get("Authorization")).toBe("Bearer tt_pk_live_example_key");
  });

  it("refuses a server key in the browser and never sends it", async () => {
    const node = mount({ key: "tt_sk_live_example_key" });
    await settled(node);
    expect(calls).toHaveLength(0);
    const root = shadow(node);
    expect(root.querySelector("[role=alert]")!.textContent).toBe("We could not load events right now.");
    expect(root.querySelector("button")).toBeNull();
  });

  it("shows an empty state", async () => {
    respond = () => page([]);
    const node = mount({ city: "Nowhere" });
    await settled(node);
    expect(shadow(node).querySelector(".note")!.textContent).toBe("No events here yet.");
  });

  it("shows an error state with a named retry button that fetches again", async () => {
    respond = () => new Response(JSON.stringify({ type: "about:blank", title: "Slow down.", status: 429, detail: "", request_id: "req_x", code: "rate_limited" }), { status: 429, headers: { "Retry-After": "30" } });
    const node = mount({ city: "Miami" });
    await settled(node);
    const root = shadow(node);
    expect(root.querySelector("[role=alert]")!.textContent).toBe("We could not load events right now.");
    const button = root.querySelector("button") as HTMLButtonElement;
    expect(button.type).toBe("button");
    expect(button.textContent).toBe("Try again");
    respond = () => page([EVENT]);
    button.click();
    await vi.waitFor(() => expect(shadow(node).querySelectorAll("li")).toHaveLength(1));
    expect(calls).toHaveLength(2);
  });

  it("accepts only a hex color", async () => {
    const node = mount({ city: "Miami", color: "red;background:url(https://evil.example.com)" });
    await settled(node);
    expect(shadow(node).querySelector("style")!.textContent).toContain("background:#0e7490");
    node.setAttribute("color", "#ff0066");
    await vi.waitFor(() => expect(shadow(node).querySelector("style")!.textContent).toContain("background:#ff0066"));
  });
});
