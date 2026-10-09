import { TimTimEvents, TimTimError, type Event, type ListEventsParams, type Simulation } from "@timtim-live/events";

/*
 * <timtim-events> — shows TimTim.Live events on any page.
 *
 *   <timtim-events city="Miami" category="music"></timtim-events>
 *   <timtim-events location="Paris,FR" partner="tt_pk_live_…" layout="list" theme="dark"></timtim-events>
 *
 * Attributes: city, country, location ("City" or "City,CC"), category, limit,
 * partner (your website or test key; `key` is the older name), lang, color,
 * layout (grid | list | compact), theme (light | dark | auto), show-images and
 * show-price ("false" hides them), tracking ("off" sends nothing), simulate.
 *
 * Tracking: when events are shown, TimTim.Live is told how many (an
 * impression), which cards came into view, and which "Get tickets" was
 * clicked — so the partner's dashboard can count them. Fire-and-forget: it
 * never delays or breaks the list. It is never money (sales are recorded by
 * TimTim.Live itself) and it carries no cookie and nothing about the visitor.
 *
 * Safety rules (the same ones the hosted widget follows):
 *  - everything is drawn inside a shadow root, so the page's CSS cannot break it
 *    and it cannot break the page;
 *  - text is set with textContent only — never innerHTML — so an event name can
 *    never become markup on someone else's site;
 *  - links and images must be https, or they are left out;
 *  - a server key (tt_sk_live_…) is refused by @timtim-live/events in a browser.
 */

/* How long the box waits for an answer, and how many times it tries again (see load()). */
export const EMBED_TIMEOUT_MS = 8_000;
export const EMBED_RETRIES = 2;

export interface TimTimEventsLabels {
  loading: string;
  empty: string;
  error: string;
  retry: string;
  getTickets: string;
  /** "{price}" is replaced by the formatted price. */
  from: string;
  free: string;
  sample: string;
  listLabel: string;
  poweredBy: string;
  status: Partial<Record<Event["status"], string>>;
}

export const DEFAULT_LABELS: TimTimEventsLabels = {
  loading: "Loading events…",
  empty: "No events here yet.",
  error: "We could not load events right now.",
  retry: "Try again",
  getTickets: "Get tickets",
  from: "From {price}",
  free: "Free",
  sample: "Sample — no real money",
  listLabel: "Events",
  poweredBy: "Events by TimTim.Live",
  status: { cancelled: "Cancelled", postponed: "Postponed", rescheduled: "Rescheduled", sold_out: "Sold out", completed: "Ended" },
};

const ATTRIBUTES = [
  "city", "category", "country", "location", "limit", "key", "partner", "lang", "color", "simulate",
  "layout", "theme", "show-images", "show-price", "tracking",
] as const;
const LAYOUTS = ["grid", "list", "compact"] as const;
const THEMES = ["light", "dark", "auto"] as const;
const SIMULATIONS: readonly Simulation[] = ["sold_out", "cancelled", "rescheduled", "postponed", "invalid_key", "rate_limited"];
const DEFAULT_COLOR = "#0e7490";
const NO_BUY_STATUS = new Set(["cancelled", "sold_out", "completed"]);
const NO_BUY_AVAILABILITY = new Set(["sold_out", "ended", "not_on_sale"]);

/** Only https URLs are ever used for a link or an image. */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string | null): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

const LIGHT = "--tt-bg:#fff;--tt-fg:#0f172a;--tt-muted:#475569;--tt-faint:#64748b;--tt-line:#e2e8f0;--tt-img:#f1f5f9";
const DARK = "--tt-bg:#0f172a;--tt-fg:#f8fafc;--tt-muted:#cbd5e1;--tt-faint:#94a3b8;--tt-line:#334155;--tt-img:#1e293b";

function css(color: string, theme: (typeof THEMES)[number]): string {
  const vars = theme === "dark" ? `:host{${DARK}}` : theme === "auto" ? `:host{${LIGHT}}@media (prefers-color-scheme:dark){:host{${DARK}}}` : `:host{${LIGHT}}`;
  return `${vars}
:host{display:block;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--tt-fg)}
:host([hidden]){display:none}
.grid{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr))}
.grid.list{grid-template-columns:minmax(0,1fr)}
.grid.list .card{flex-direction:row}.grid.list .img{width:min(180px,35%);aspect-ratio:4/3;flex:none}
.grid.compact{grid-template-columns:minmax(0,1fr);gap:6px}
.grid.compact .img,.grid.compact .badges{display:none}.grid.compact .card{flex-direction:row;align-items:center;border-radius:12px}
.grid.compact .body{flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px 12px;padding:8px 12px}
.grid.compact .name{font-size:15px;flex:1 1 200px}.grid.compact .buy{margin:0;padding:6px 10px;font-size:14px}
li{display:flex}
.card{flex:1;background:var(--tt-bg);border:1px solid var(--tt-line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.img{width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--tt-img);display:block}
.body{padding:12px 14px;display:flex;flex-direction:column;gap:4px;flex:1}
.badges{display:flex;gap:6px;flex-wrap:wrap}
.badge{font-size:11px;font-weight:800;letter-spacing:.04em;color:#92400e;background:#fef3c7;border-radius:999px;padding:2px 8px}
.status{color:#991b1b;background:#fee2e2}
.name{font-size:16px;font-weight:800;line-height:1.25;margin:0}
.meta{font-size:14px;color:var(--tt-muted);margin:0}
.price{font-size:14px;font-weight:700;margin:0}
.buy{margin-top:auto;display:block;text-align:center;background:${color};color:#fff;text-decoration:none;font-weight:800;border-radius:12px;padding:10px 12px;font-size:15px}
.buy:focus-visible,.retry:focus-visible,.foot a:focus-visible{outline:3px solid var(--tt-fg);outline-offset:2px}
.note{font-size:14px;color:var(--tt-muted);padding:8px 0;margin:0}
.retry{font:inherit;font-size:14px;font-weight:700;border:1px solid var(--tt-line);background:var(--tt-bg);color:var(--tt-fg);border-radius:10px;padding:6px 12px;cursor:pointer}
.foot{font-size:12px;color:var(--tt-faint);margin:8px 0 0}.foot a{color:inherit}`;
}

/* So that importing this file during server rendering does not crash (there is no HTMLElement there). */
const Base = (typeof HTMLElement !== "undefined" ? HTMLElement : class {}) as typeof HTMLElement;

export class TimTimEventsElement extends Base {
  static readonly observedAttributes = [...ATTRIBUTES];

  /** Override the words (they are English by default). `lang` changes date and price formatting. */
  labels: TimTimEventsLabels = DEFAULT_LABELS;
  /** The events currently shown. */
  events: Event[] = [];

  private readonly root: ShadowRoot;
  private sequence = 0;
  private scheduled = false;
  private client: TimTimEvents | null = null;
  private observer: IntersectionObserver | null = null;
  /** One random id per element per page load, so a retried signal is counted once. Not a cookie; nothing about the visitor. */
  private readonly viewId = randomViewId();
  private readonly viewed = new Set<string>();

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.schedule();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue && this.isConnected) this.schedule();
  }

  /** Fetch again now. Resolves when the new events (or the error) are shown. */
  refresh(): Promise<void> {
    return this.load();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    /* Several attributes changed in one go → one request. */
    queueMicrotask(() => {
      this.scheduled = false;
      void this.load();
    });
  }

  private attr(name: (typeof ATTRIBUTES)[number]): string | undefined {
    const v = this.getAttribute(name)?.trim();
    return v ? v.slice(0, 120) : undefined;
  }

  private params(): ListEventsParams {
    const limit = Math.min(Math.max(parseInt(this.attr("limit") ?? "6", 10) || 6, 1), 100);
    const [locCity, locCountry] = parseLocation(this.attr("location"));
    return { city: this.attr("city") ?? locCity, category: this.attr("category"), country: this.attr("country") ?? locCountry, limit };
  }

  /** `partner` is the website or test key; `key` is the older name for the same thing. */
  private key(): string | undefined {
    return this.attr("partner") ?? this.attr("key");
  }

  private layout(): (typeof LAYOUTS)[number] {
    const v = this.attr("layout") as (typeof LAYOUTS)[number] | undefined;
    return v && LAYOUTS.includes(v) ? v : "grid";
  }

  private theme(): (typeof THEMES)[number] {
    const v = this.attr("theme") as (typeof THEMES)[number] | undefined;
    return v && THEMES.includes(v) ? v : "light";
  }

  private shows(name: "show-images" | "show-price"): boolean {
    return this.attr(name)?.toLowerCase() !== "false";
  }

  /* No signals for a simulated bad day: it is a developer rehearsing, not a visitor. */
  private tracking(): boolean {
    return this.attr("tracking")?.toLowerCase() !== "off" && !this.attr("simulate");
  }

  /* Fire-and-forget: a failed signal is ignored, never shown, never retried. */
  private signal(type: "impression" | "event_view" | "event_click", eventId?: string, shown?: number): void {
    if (!this.client || !this.tracking()) return;
    void this.client.track({ type, view: this.viewId, ...(eventId ? { event_id: eventId } : {}), ...(shown != null ? { shown } : {}) }).catch(() => {});
  }

  private locale(): string {
    return this.attr("lang") ?? (typeof document !== "undefined" ? document.documentElement.lang : "") ?? "en";
  }

  private color(): string {
    const c = this.attr("color");
    return c && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : DEFAULT_COLOR;
  }

  private async load(): Promise<void> {
    const seq = ++this.sequence;
    const key = this.key();
    this.draw((box) => {
      box.setAttribute("aria-busy", "true");
      box.appendChild(el("p", "note", this.labels.loading));
    });
    try {
      /*
       * A page must not wait 30 seconds on a box of events: give up after 8, and
       * try a failed read twice more (a short random wait, or the server's
       * Retry-After when it is at most 4 seconds) before showing the error.
       */
      const client = new TimTimEvents({ apiKey: key, timeoutMs: EMBED_TIMEOUT_MS, retries: EMBED_RETRIES, maxRetryDelayMs: 4_000 });
      this.client = client;
      let page;
      if (key) {
        page = await client.events.list(this.params());
      } else {
        const sim = this.attr("simulate") as Simulation | undefined;
        page = await client.demo.events.list({ ...this.params(), simulate: sim && SIMULATIONS.includes(sim) ? sim : undefined });
      }
      if (seq !== this.sequence) return; /* a newer request replaced this one */
      this.events = page.events;
      this.drawEvents(page.events);
      if (page.events.length) this.signal("impression", undefined, page.events.length);
      this.dispatchEvent(new CustomEvent("timtim-events-loaded", { detail: { events: page.events } }));
    } catch (error) {
      if (seq !== this.sequence) return;
      this.events = [];
      this.drawError(error);
      this.dispatchEvent(new CustomEvent("timtim-events-error", { detail: { error } }));
    }
  }

  private draw(fill: (box: HTMLDivElement) => void): void {
    this.observer?.disconnect();
    this.observer = null;
    const style = el("style");
    style.textContent = css(this.color(), this.theme());
    const box = el("div", "wrap");
    box.setAttribute("part", "container");
    const lang = this.attr("lang");
    if (lang) box.setAttribute("lang", lang);
    fill(box);
    this.root.replaceChildren(style, box);
  }

  private foot(): HTMLParagraphElement {
    const p = el("p", "foot");
    const a = el("a", undefined, this.labels.poweredBy);
    a.href = "https://timtim.live";
    a.target = "_blank";
    a.rel = "noopener";
    p.appendChild(a);
    return p;
  }

  private drawError(error: unknown): void {
    /* Details go to the console for the developer; the visitor sees plain words. */
    if (typeof console !== "undefined") console.error("<timtim-events>:", error);
    const fixable = !(error instanceof TimTimError && (error.code === "secret_key_in_browser" || error.code === "key_required"));
    this.draw((box) => {
      box.appendChild(el("p", "note", this.labels.error)).setAttribute("role", "alert");
      if (fixable) {
        const retry = el("button", "retry", this.labels.retry);
        retry.type = "button";
        retry.addEventListener("click", () => void this.load());
        box.appendChild(retry);
      }
      box.appendChild(this.foot());
    });
  }

  private drawEvents(events: Event[]): void {
    const L = this.labels;
    const lang = this.locale() || "en";
    let dateFmt: Intl.DateTimeFormat | null = null;
    try {
      dateFmt = new Intl.DateTimeFormat(lang, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
    } catch {
      dateFmt = null;
    }
    const price = (t: Event["tickets"]): string => {
      if (t?.from == null) return "";
      if (t.from === 0) return L.free;
      const currency = t.currency || "USD";
      try {
        return L.from.replace("{price}", new Intl.NumberFormat(lang, { style: "currency", currency }).format(t.from));
      } catch {
        return L.from.replace("{price}", `${t.from} ${currency}`);
      }
    };

    const showImages = this.shows("show-images");
    const showPrice = this.shows("show-price");
    this.draw((box) => {
      if (!events.length) {
        box.appendChild(el("p", "note", L.empty));
        box.appendChild(this.foot());
        return;
      }
      const list = el("ul", this.layout() === "grid" ? "grid" : `grid ${this.layout()}`);
      list.setAttribute("role", "list");
      list.setAttribute("aria-label", L.listLabel);
      for (const e of events) {
        const item = el("li");
        const article = el("article", "card");
        const img = showImages ? safeHttpsUrl(e.image) : null;
        if (img) {
          const i = el("img", "img");
          i.src = img;
          i.alt = "";
          i.loading = "lazy";
          article.appendChild(i);
        }
        const body = el("div", "body");
        const badges = el("div", "badges");
        if (e.test) badges.appendChild(el("span", "badge", L.sample));
        const statusLabel = e.status !== "scheduled" ? L.status[e.status] : undefined;
        if (statusLabel) badges.appendChild(el("span", "badge status", statusLabel));
        if (badges.childNodes.length) body.appendChild(badges);
        body.appendChild(el("h3", "name", e.name));
        const when = lang.toLowerCase().startsWith("en") && e.display?.date_label ? e.display.date_label : dateFmt && e.date ? dateFmt.format(new Date(`${e.date}T12:00:00Z`)) : e.display?.date_label;
        const where = [e.location?.venue, e.location?.city].filter(Boolean).join(", ");
        const meta = [when, where].filter(Boolean).join(" · ");
        if (meta) body.appendChild(el("p", "meta", meta));
        const p = showPrice ? price(e.tickets) : "";
        if (p) body.appendChild(el("p", "price", p));
        const href = safeHttpsUrl(e.tickets?.buy_url);
        const canBuy = href && !NO_BUY_STATUS.has(e.status) && !NO_BUY_AVAILABILITY.has(e.tickets?.availability ?? "");
        if (canBuy) {
          const a = el("a", "buy", L.getTickets);
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener";
          a.setAttribute("aria-label", `${L.getTickets}: ${e.name}`);
          a.addEventListener("click", () => this.signal("event_click", e.id));
          body.appendChild(a);
        }
        article.appendChild(body);
        article.dataset.eventId = e.id;
        item.appendChild(article);
        list.appendChild(item);
      }
      box.appendChild(list);
      box.appendChild(this.foot());
    });
    this.watchViews();
  }

  /** event_view once per card per page load, when at least half of it is on screen. */
  private watchViews(): void {
    if (!this.tracking() || typeof IntersectionObserver !== "function") return;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.eventId;
        if (!entry.isIntersecting || !id || this.viewed.has(id)) continue;
        this.viewed.add(id);
        this.observer?.unobserve(entry.target);
        this.signal("event_view", id);
      }
    }, { threshold: 0.5 });
    for (const card of this.root.querySelectorAll<HTMLElement>("article[data-event-id]")) this.observer.observe(card);
  }
}

/** "Paris" or "Paris,FR" → [city, country]. */
export function parseLocation(value: string | undefined): [string | undefined, string | undefined] {
  if (!value) return [undefined, undefined];
  const parts = value.split(",").map((p) => p.trim());
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  if (/^[A-Za-z]{2}$/.test(last)) return [parts.slice(0, -1).join(", ") || undefined, last.toUpperCase()];
  return [value.trim() || undefined, undefined];
}

function randomViewId(): string {
  const bytes = new Uint8Array(12);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `pv_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Registers <timtim-events> once. Safe to call more than once. */
export function defineTimTimEvents(tagName = "timtim-events"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tagName)) return;
  customElements.define(tagName, tagName === "timtim-events" ? TimTimEventsElement : class extends TimTimEventsElement {});
}
