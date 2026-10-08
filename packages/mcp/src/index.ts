/*
 * @timtim-live/mcp — a read-only MCP server for TimTim.Live events.
 *
 * It runs on YOUR machine and talks to the public TimTim.Live API through
 * @timtim-live/events. TimTim.Live also hosts the same tools at
 * https://api.timtim.live/v1/mcp — use that if you would rather not run
 * anything (https://timtim.live/developers/ai).
 *
 * Read-only on purpose: there is no tool that buys, refunds, changes an event
 * or touches an account.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TimTimEvents, TimTimApiError, TimTimError, type Event, type TimTimEventsOptions } from "@timtim-live/events";
import { z } from "zod";

export const SERVER_NAME = "timtim-live-events";
export const SERVER_VERSION = "0.1.0";

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const country = z.string().regex(/^[A-Za-z]{2}$/, "two letters, for example US").describe("Two-letter country code, for example US or FR.");
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").describe("A day, YYYY-MM-DD.");
const limit = z.number().int().min(1).max(50).describe("How many events (1–50).");

/** One event as words an assistant can quote: name, status, when, where, id, page, ticket link. */
export function describeEvent(e: Event): string {
  const where = [e.location?.venue, e.location?.city, e.location?.country].filter(Boolean).join(", ");
  const when = e.display?.date_label || e.date;
  const status = e.status !== "scheduled" ? ` [${e.status.replace("_", " ").toUpperCase()}]` : "";
  return [
    `• ${e.name}${status}`,
    when ? `  When: ${when}` : "",
    where ? `  Where: ${where}` : "",
    `  Id: ${e.id}`,
    e.url ? `  Page: ${e.url}` : "",
    e.tickets?.buy_url ? `  Tickets: ${e.tickets.buy_url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function sampleNote(mode: string | undefined): string {
  return mode === "test" ? "SAMPLE DATA — these are test events, not real ones. No real money moves.\n\n" : "";
}

function listText(events: Event[], mode: string | undefined): string {
  if (!events.length) return `${sampleNote(mode)}No events match. Try a nearby city, another type, or list_locations to see where events are.`;
  return `${sampleNote(mode)}${events.length} event${events.length === 1 ? "" : "s"}:\n\n${events.map(describeEvent).join("\n\n")}`;
}

type ToolResult = { content: Array<{ type: "text"; text: string }>; structuredContent?: Record<string, unknown>; isError?: boolean };

function ok(text: string, data: unknown): ToolResult {
  return { content: [{ type: "text", text }], structuredContent: data as Record<string, unknown> };
}

/* A problem the assistant can read and act on — never a crash. */
function failed(error: unknown): ToolResult {
  const text =
    error instanceof TimTimApiError ? `${error.title} ${error.detail}`.trim()
    : error instanceof TimTimError ? error.message
    : "Something went wrong reaching TimTim.Live.";
  return { content: [{ type: "text", text }], isError: true };
}

async function guarded(run: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await run();
  } catch (error) {
    return failed(error);
  }
}

export type CreateServerOptions = Pick<TimTimEventsOptions, "apiKey" | "baseUrl" | "fetch" | "timeoutMs">;

/**
 * The MCP server with its six tools. With no apiKey every answer is sample
 * data and says so. Pass a website key, test key or — since this runs on your
 * own machine — a server key.
 */
export function createServer(options: CreateServerOptions = {}): McpServer {
  const client = new TimTimEvents(options);
  const keyed = Boolean(options.apiKey);
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Find public live events from TimTim.Live. Every event has an id, a status, a TimTim.Live page (url) and a ticket link (tickets.buy_url) — " +
        "give people the buy_url exactly as it is. Without a key these are sample events: say so. This server is read-only.",
    },
  );

  const search = (params: Record<string, string | number | undefined>) =>
    guarded(async () => {
      const page = keyed ? await client.events.list(params) : await client.demo.events.list(params);
      return ok(listText(page.events, page.mode), page);
    });

  server.registerTool(
    "find_events",
    {
      title: "Find events",
      description: "Find public live events from TimTim.Live using a city, country, category, dates or a performer's name. Upcoming events, soonest first.",
      inputSchema: { city: z.string().max(80).optional().describe("City name, for example Miami."), country: country.optional(), category: z.string().max(40).optional().describe("Event type, for example music."), from: day.optional(), to: day.optional(), artist: z.string().max(80).optional().describe("Part of a performer's name."), limit: limit.optional() },
      annotations: { title: "Find events", ...READ_ONLY },
    },
    async (a) => search({ city: a.city, country: a.country?.toUpperCase(), category: a.category?.toLowerCase(), from: a.from, to: a.to, artist: a.artist, limit: a.limit ?? 10 }),
  );

  server.registerTool(
    "find_events_near_location",
    {
      title: "Find events near a place",
      description: "Find public live events near a point on the map (latitude and longitude), within a radius in kilometres.",
      inputSchema: { latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), radius_km: z.number().min(1).max(500).optional(), category: z.string().max(40).optional(), limit: limit.optional() },
      annotations: { title: "Find events near a place", ...READ_ONLY },
    },
    async (a) => search({ lat: a.latitude, lng: a.longitude, radius: a.radius_km ?? 50, category: a.category?.toLowerCase(), limit: a.limit ?? 10 }),
  );

  server.registerTool(
    "find_events_by_category",
    {
      title: "Find events by type",
      description: "Find public live events of one type (music, festival, nightlife, conference…), optionally in one city or country.",
      inputSchema: { category: z.string().min(1).max(40), city: z.string().max(80).optional(), country: country.optional(), limit: limit.optional() },
      annotations: { title: "Find events by type", ...READ_ONLY },
    },
    async (a) => search({ category: a.category.toLowerCase(), city: a.city, country: a.country?.toUpperCase(), limit: a.limit ?? 10 }),
  );

  server.registerTool(
    "get_event",
    {
      title: "Get one event",
      description: "Get one event by its TimTim.Live id — including when it was cancelled, postponed or has ended.",
      inputSchema: { id: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/, "an id exactly as another tool returned it") },
      annotations: { title: "Get one event", ...READ_ONLY },
    },
    async ({ id }) =>
      guarded(async () => {
        if (keyed) {
          const res = await client.events.get(id);
          return ok(`${sampleNote(res.mode)}${describeEvent(res.event)}`, res);
        }
        /* Without a key there is no single-event address; the sample list is small. */
        const page = await client.demo.events.list({ limit: 100 });
        const event = page.events.find((e) => e.id === id);
        return event
          ? ok(`${sampleNote("test")}${describeEvent(event)}`, { object: "event", mode: "test", event })
          : { content: [{ type: "text", text: "We could not find that event. Without a key only the sample events can be read." }], isError: true };
      }),
  );

  server.registerTool(
    "list_categories",
    {
      title: "List event types",
      description: "Which event types have upcoming events, with how many each.",
      inputSchema: { country: country.optional() },
      annotations: { title: "List event types", ...READ_ONLY },
    },
    async (a) =>
      guarded(async () => {
        const res = await client.categories.list({ country: a.country?.toUpperCase() });
        const lines = res.categories.map((c) => `• ${c.id}: ${c.events}`).join("\n");
        return ok(`${sampleNote(res.mode)}${lines || "No event types have upcoming events."}`, res);
      }),
  );

  server.registerTool(
    "list_locations",
    {
      title: "List cities",
      description: "Which cities have upcoming events, with how many each.",
      inputSchema: { country: country.optional(), limit: z.number().int().min(1).max(200).optional() },
      annotations: { title: "List cities", ...READ_ONLY },
    },
    async (a) =>
      guarded(async () => {
        const res = await client.locations.list({ country: a.country?.toUpperCase(), limit: a.limit ?? 50 });
        const lines = res.locations.map((l) => `• ${l.city}${l.country ? `, ${l.country}` : ""}: ${l.events}`).join("\n");
        return ok(`${sampleNote(res.mode)}${lines || "No cities have upcoming events."}`, res);
      }),
  );

  return server;
}
