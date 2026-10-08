import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Liquid } from "liquidjs";
import { cleanup, render } from "@testing-library/react";
import TimTimEvents, { EMBED_SRC, embedAttributes } from "../framer/TimTimEvents.js";
import { registered } from "./framer-stub.js";

/* happy-dom replaces the global URL, so the folder comes from Node directly. */
const here = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(here, p), "utf8").replace(/\r\n/g, "\n");
const HOSTED = "https://timtim.live/embed/v1/timtim-events.js";

afterEach(() => cleanup());

/* ── Shopify: render the real block with a real Liquid engine ── */

const liquidSource = read("shopify/extensions/timtim-events/blocks/timtim-events.liquid");
const blockSchema = JSON.parse(/\{% schema %\}([\s\S]*?)\{% endschema %\}/.exec(liquidSource)![1]);
const engine = new Liquid();
/* Shopify adds `{% schema %}` and `block.shopify_attributes`; liquidjs knows neither, so the schema is cut and the attributes are given. */
const template = liquidSource.replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/, "");
const defaults = Object.fromEntries(blockSchema.settings.filter((s: { default?: unknown }) => "default" in s).map((s: { id: string; default: unknown }) => [s.id, s.default]));
const renderBlock = (settings: Record<string, unknown>) =>
  engine.parseAndRender(template, { block: { settings: { ...defaults, partner_key: "", ...settings }, shopify_attributes: 'data-shopify-editor-block="x"' }, request: { locale: { iso_code: "fr" } } });
/* Parse the rendered block (a detached document, so nothing in it runs). */
const tagOf = (html: string) => new DOMParser().parseFromString(html, "text/html").querySelector("timtim-events")!;

describe("Shopify theme app block", () => {
  it("has a schema the theme editor can show: a section target and every setting labelled", () => {
    expect(blockSchema.name).toBe("TimTim.Live Events");
    expect(blockSchema.target).toBe("section");
    for (const s of blockSchema.settings) expect(typeof s.label).toBe("string");
  });

  it("renders the embed with the merchant's settings and the store's language", async () => {
    const html = await renderBlock({ location: " Paris,FR ", category: "festival", layout: "compact", theme: "dark", show_images: false });
    const el = tagOf(html);
    expect(el.getAttribute("location")).toBe("Paris,FR");
    expect(el.getAttribute("category")).toBe("festival");
    expect(el.getAttribute("layout")).toBe("compact");
    expect(el.getAttribute("theme")).toBe("dark");
    expect(el.getAttribute("show-images")).toBe("false");
    expect(el.hasAttribute("show-price")).toBe(false);
    expect(el.getAttribute("lang")).toBe("fr");
    expect(html).toContain(`<script src="${HOSTED}" defer></script>`);
  });

  it("writes a website or test key, and NEVER a server key", async () => {
    expect(tagOf(await renderBlock({ partner_key: "tt_pk_live_abcdefgh12" })).getAttribute("partner")).toBe("tt_pk_live_abcdefgh12");
    expect(tagOf(await renderBlock({ partner_key: "tt_test_abcdefgh12" })).getAttribute("partner")).toBe("tt_test_abcdefgh12");
    expect(tagOf(await renderBlock({ partner_key: "tt_sk_live_abcdefgh12" })).hasAttribute("partner")).toBe(false);
    expect(await renderBlock({ partner_key: "xx tt_pk_live_abcdefgh12" })).not.toContain("tt_pk_live_");
  });

  it("escapes what a merchant types", async () => {
    const html = await renderBlock({ location: '"><script>alert(1)</script>', heading: "<b>Hi</b>" });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<b>Hi</b>");
    expect(tagOf(html).getAttribute("location")).toBe('"><script>alert(1)</script>');
  });
});

/* ── Framer ── */

describe("Framer code component", () => {
  it("offers the controls a designer needs in the property panel", () => {
    const controls = registered.get(TimTimEvents)!;
    expect(Object.keys(controls)).toEqual(["location", "category", "limit", "layout", "theme", "color", "showImages", "showPrice", "partner"]);
  });

  it("passes settings to <timtim-events> and loads the hosted embed once", () => {
    const { container, rerender } = render(<TimTimEvents {...TimTimEvents.defaultProps} location="Paris,FR" layout="list" />);
    const el = container.querySelector("timtim-events")!;
    expect(el.getAttribute("location")).toBe("Paris,FR");
    expect(el.getAttribute("layout")).toBe("list");
    rerender(<TimTimEvents {...TimTimEvents.defaultProps} location="Miami,US" />);
    expect(container.querySelector("timtim-events")!.getAttribute("location")).toBe("Miami,US");
    expect(container.querySelector("timtim-events")!.hasAttribute("layout")).toBe(false);
    expect(document.querySelectorAll(`script[src="${HOSTED}"]`)).toHaveLength(1);
    expect(EMBED_SRC).toBe(HOSTED);
  });

  it("never passes a server key, and drops a non-hex color", () => {
    expect(embedAttributes({ partner: "tt_sk_live_abcdefgh12" }).partner).toBeUndefined();
    expect(embedAttributes({ partner: "tt_pk_live_abcdefgh12" }).partner).toBe("tt_pk_live_abcdefgh12");
    expect(embedAttributes({ color: "rgb(0,0,0)" }).color).toBeUndefined();
  });
});

/* ── Bubble: run the plugin-editor snippets the way Bubble does, with a fake `instance` ── */

describe("Bubble plugin element", () => {
  /* Bubble stores each action as a bare function; evaluate it as an expression, comments and all. */
  const load = (file: string) => new Function(`return (${read(`bubble/plugin-element/${file}`).replace(/^\/\/.*$/gm, "")})`)() as (...args: unknown[]) => void;
  const initialize = load("initialize.js");
  const update = load("update.js");

  function instance() {
    const canvas = document.createElement("div");
    const states: Record<string, unknown> = {};
    const events: string[] = [];
    return { canvas: { append: (n: Node) => canvas.appendChild(n) }, data: {} as Record<string, HTMLElement>, publishState: (k: string, v: unknown) => (states[k] = v), triggerEvent: (e: string) => events.push(e), states, events, root: canvas };
  }

  it("creates one <timtim-events>, sets fields as attributes, and never a server key", () => {
    const i = instance();
    initialize(i, {});
    update(i, { location: " Paris,FR ", category: "Festival", limit: 500, layout: "list", theme: "light", color: "#ff0066", show_images: false, show_price: true, partner_key: "tt_sk_live_abcdefgh12" }, {});
    const el = i.root.querySelector("timtim-events")!;
    expect(el.getAttribute("location")).toBe("Paris,FR");
    expect(el.getAttribute("category")).toBe("festival");
    expect(el.getAttribute("limit")).toBe("100");
    expect(el.getAttribute("layout")).toBe("list");
    expect(el.hasAttribute("theme")).toBe(false);
    expect(el.getAttribute("show-images")).toBe("false");
    expect(el.hasAttribute("partner")).toBe(false);
    update(i, { location: "Miami,US", partner_key: "tt_pk_live_abcdefgh12" }, {});
    expect(el.hasAttribute("layout")).toBe(false);
    expect(el.getAttribute("partner")).toBe("tt_pk_live_abcdefgh12");
    expect(i.root.querySelectorAll("timtim-events")).toHaveLength(1);
  });

  it("tells Bubble workflows when events loaded, and how many", () => {
    const i = instance();
    initialize(i, {});
    i.data.el.dispatchEvent(new CustomEvent("timtim-events-loaded", { detail: { events: [1, 2, 3] } }));
    expect(i.states.event_count).toBe(3);
    expect(i.events).toEqual(["events_loaded"]);
    i.data.el.dispatchEvent(new CustomEvent("timtim-events-error", { detail: {} }));
    expect(i.events).toEqual(["events_loaded", "events_failed"]);
  });
});

/* ── Every adapter ── */

function files(dir: string): string[] {
  return readdirSync(join(here, dir)).flatMap((name) => {
    const p = `${dir}/${name}`;
    return statSync(join(here, p)).isDirectory() ? files(p) : [p];
  });
}

describe("every platform adapter", () => {
  const adapters = ["shopify", "framer", "drupal", "joomla", "wix", "webflow", "squarespace", "bubble"];

  it("has a README with install steps, a 5-minute example, settings, troubleshooting, compatibility and a test plan", () => {
    for (const name of adapters) {
      const readme = read(`${name}/README.md`);
      for (const heading of ["## Install", "## 5-minute example", "## Settings", "## Troubleshooting", "## Compatibility", "## Test plan"]) {
        expect(readme, `${name}/README.md needs "${heading}"`).toContain(heading);
      }
    }
  });

  it("loads the hosted embed — never a copy of the event logic — and contains no server key", () => {
    for (const name of adapters) {
      /* Test files hold fake server keys on purpose, to prove they are refused — so they are not scanned here. */
      const all = files(name).filter((f) => !f.endsWith(".png") && !f.includes("/test/")).map((f) => read(f)).join("\n");
      expect(all, `${name} points at the hosted embed`).toContain(HOSTED);
      expect(all, `${name} contains no server key`).not.toMatch(/tt_sk_live_[A-Za-z0-9]{6,}(?!…)/);
      expect(all, `${name} does not call the API itself`).not.toMatch(/api\.timtim\.live\/v1\/events/);
    }
  });
});
