import { TimTimEvents, TimTimError, type Event, type ListEventsParams, type Simulation } from "@timtim-live/events";

/*
 * <timtim-events> — shows TimTim.Live events on any page.
 *
 *   <timtim-events city="Miami" category="music"></timtim-events>
 *
 * Safety rules (the same ones the hosted widget follows):
 *  - everything is drawn inside a shadow root, so the page's CSS cannot break it
 *    and it cannot break the page;
 *  - text is set with textContent only — never innerHTML — so an event name can
 *    never become markup on someone else's site;
 *  - links and images must be https, or they are left out;
 *  - a server key (tt_sk_live_…) is refused by @timtim-live/events in a browser.
 */

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

const ATTRIBUTES = ["city", "category", "country", "limit", "key", "lang", "color", "simulate"] as const;
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

function css(color: string): string {
  return `:host{display:block;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0f172a}
:host([hidden]){display:none}
.grid{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
li{display:flex}
.card{flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.img{width:100%;aspect-ratio:16/9;object-fit:cover;background:#f1f5f9;display:block}
.body{padding:12px 14px;display:flex;flex-direction:column;gap:4px;flex:1}
.badges{display:flex;gap:6px;flex-wrap:wrap}
.badge{font-size:11px;font-weight:800;letter-spacing:.04em;color:#92400e;background:#fef3c7;border-radius:999px;padding:2px 8px}
.status{color:#991b1b;background:#fee2e2}
.name{font-size:16px;font-weight:800;line-height:1.25;margin:0}
.meta{font-size:14px;color:#475569;margin:0}
.price{font-size:14px;font-weight:700;margin:0}
.buy{margin-top:auto;display:block;text-align:center;background:${color};color:#fff;text-decoration:none;font-weight:800;border-radius:12px;padding:10px 12px;font-size:15px}
.buy:focus-visible,.retry:focus-visible,.foot a:focus-visible{outline:3px solid #0f172a;outline-offset:2px}
.note{font-size:14px;color:#475569;padding:8px 0;margin:0}
.retry{font:inherit;font-size:14px;font-weight:700;border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:6px 12px;cursor:pointer}
.foot{font-size:12px;color:#64748b;margin:8px 0 0}.foot a{color:inherit}`;
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

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.schedule();
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
    return { city: this.attr("city"), category: this.attr("category"), country: this.attr("country"), limit };
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
    const key = this.attr("key");
    this.draw((box) => {
      box.setAttribute("aria-busy", "true");
      box.appendChild(el("p", "note", this.labels.loading));
    });
    try {
      const client = new TimTimEvents({ apiKey: key });
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
      this.dispatchEvent(new CustomEvent("timtim-events-loaded", { detail: { events: page.events } }));
    } catch (error) {
      if (seq !== this.sequence) return;
      this.events = [];
      this.drawError(error);
      this.dispatchEvent(new CustomEvent("timtim-events-error", { detail: { error } }));
    }
  }

  private draw(fill: (box: HTMLDivElement) => void): void {
    const style = el("style");
    style.textContent = css(this.color());
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

    this.draw((box) => {
      if (!events.length) {
        box.appendChild(el("p", "note", L.empty));
        box.appendChild(this.foot());
        return;
      }
      const list = el("ul", "grid");
      list.setAttribute("role", "list");
      list.setAttribute("aria-label", L.listLabel);
      for (const e of events) {
        const item = el("li");
        const article = el("article", "card");
        const img = safeHttpsUrl(e.image);
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
        const p = price(e.tickets);
        if (p) body.appendChild(el("p", "price", p));
        const href = safeHttpsUrl(e.tickets?.buy_url);
        const canBuy = href && !NO_BUY_STATUS.has(e.status) && !NO_BUY_AVAILABILITY.has(e.tickets?.availability ?? "");
        if (canBuy) {
          const a = el("a", "buy", L.getTickets);
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener";
          a.setAttribute("aria-label", `${L.getTickets}: ${e.name}`);
          body.appendChild(a);
        }
        article.appendChild(body);
        item.appendChild(article);
        list.appendChild(item);
      }
      box.appendChild(list);
      box.appendChild(this.foot());
    });
  }
}

/** Registers <timtim-events> once. Safe to call more than once. */
export function defineTimTimEvents(tagName = "timtim-events"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tagName)) return;
  customElements.define(tagName, tagName === "timtim-events" ? TimTimEventsElement : class extends TimTimEventsElement {});
}
