/*
 * Integration tests: the REAL keyless demo endpoint, checked against the
 * contract (openapi.yaml in this package) with ajv. Needs the internet.
 *
 *   npm run test:integration
 *
 * TIMTIM_API_BASE overrides the address (default https://api.timtim.live/v1).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { parse } from "yaml";
import { TimTimApiError, TimTimEvents, type EventList } from "../src/index.js";

const BASE = process.env.TIMTIM_API_BASE ?? "https://api.timtim.live/v1";
const contract = parse(readFileSync(fileURLToPath(new URL("../openapi.yaml", import.meta.url)), "utf8"));

/* One JSON Schema document holding every component schema, with OpenAPI refs pointed at $defs. */
function rewriteRefs(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(rewriteRefs);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$ref" && typeof v === "string") out[k] = v.replace("#/components/schemas/", "contract#/$defs/");
      else if (k === "example") continue; /* OpenAPI keyword, not JSON Schema */
      else out[k] = rewriteRefs(v);
    }
    return out;
  }
  return node;
}

const addFormats = (addFormatsModule as unknown as { default?: typeof addFormatsModule }).default ?? addFormatsModule;
const ajv = new Ajv2020({ allErrors: true, strict: false });
(addFormats as unknown as (a: Ajv2020) => void)(ajv);
ajv.addSchema({ $id: "contract", $defs: rewriteRefs(contract.components.schemas) as object });
const demoOp = contract.paths["/demo/events"].get;
const validateList = ajv.compile(rewriteRefs(demoOp.responses["200"].content["application/json"].schema) as object);
const validateEvent = ajv.compile({ $ref: "contract#/$defs/Event" });
const validateProblem = ajv.compile({ $ref: "contract#/$defs/Problem" });

function assertValid(validate: typeof validateList, data: unknown, what: string) {
  const ok = validate(data);
  if (!ok) throw new Error(`${what} does not match the contract: ${ajv.errorsText(validate.errors)}`);
}

const tt = new TimTimEvents({ baseUrl: BASE });

async function demo(params: Record<string, string>) {
  const url = `${BASE}/demo/events?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  if (res.status === 404) throw new Error(`${url} answered 404 — the demo endpoint is not deployed at this address yet.`);
  return res;
}

describe(`keyless demo endpoint (${BASE}/demo/events)`, () => {
  it("Miami + music returns sample events that match the contract", async () => {
    const page = await tt.events.list({ city: "Miami", category: "music" });
    assertValid(validateList, page, "the list");
    expect(page.object).toBe("list");
    expect(page.mode).toBe("test");
    expect(page.events.length).toBeGreaterThan(0);
    for (const event of page.events) {
      assertValid(validateEvent, event, `event ${event.id}`);
      expect(event.name.startsWith("TEST EVENT — NO REAL MONEY")).toBe(true);
      expect(event.test).toBe(true);
      expect(event.location.city).toBe("Miami");
      expect(event.category).toBe("music");
      expect(event.tickets.buy_url?.startsWith("https://")).toBe(true);
    }
  });

  it("answers any website (CORS *) with a request id", async () => {
    const res = await demo({ city: "Paris" });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("timtim-request-id")).toMatch(/^req_/);
  });

  it("pages with cursor until next is null, every page valid", async () => {
    const pages: EventList[] = [];
    for await (const page of tt.events.iterate({ limit: 2 })) {
      assertValid(validateList, page, `page ${pages.length + 1}`);
      pages.push(page);
      if (pages.length > 20) throw new Error("more than 20 pages of sample events — paging may not end");
    }
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.at(-1)!.next).toBeNull();
    const ids = pages.flatMap((p) => p.events.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("simulate=sold_out makes every sample event sold out", async () => {
    const page = await tt.demo.events.list({ simulate: "sold_out" });
    assertValid(validateList, page, "the list");
    expect(page.events.length).toBeGreaterThan(0);
    for (const e of page.events) {
      expect(e.status).toBe("sold_out");
      expect(e.tickets.availability).toBe("sold_out");
    }
    expect(page.notices?.some((n) => n.startsWith("SIMULATED"))).toBe(true);
  });

  it("simulate=cancelled makes every sample event cancelled", async () => {
    const page = await tt.demo.events.list({ city: "Miami", simulate: "cancelled" });
    assertValid(validateList, page, "the list");
    expect(page.events.length).toBeGreaterThan(0);
    for (const e of page.events) expect(e.status).toBe("cancelled");
  });

  it("simulate=invalid_key answers the 401 problem a real bad key gets", async () => {
    const err = await tt.demo.events.list({ simulate: "invalid_key" }).catch((e) => e);
    expect(err).toBeInstanceOf(TimTimApiError);
    expect(err.status).toBe(401);
    expect(err.requestId).toMatch(/^req_/);
    assertValid(validateProblem, err.body, "the 401 problem");
    const raw = await demo({ simulate: "invalid_key" });
    expect(raw.headers.get("content-type")).toContain("application/problem+json");
  });

  it("simulate=rate_limited answers 429 with Retry-After", async () => {
    const err = await tt.demo.events.list({ simulate: "rate_limited" }).catch((e) => e);
    expect(err).toBeInstanceOf(TimTimApiError);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBeGreaterThan(0);
    assertValid(validateProblem, err.body, "the 429 problem");
  });
});
