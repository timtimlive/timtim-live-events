import { TimTimApiError, TimTimEvents, type Event } from "@timtim-live/events";

/*
 * A React Server Component: the request to TimTim.Live runs on the server, so
 * TIMTIM_KEY may be any key — including a server key (tt_sk_live_…) — and it
 * never reaches the browser. With no TIMTIM_KEY it uses demo mode (sample events).
 */
export const dynamic = "force-dynamic"; /* fetch on every request, not at build time */

async function loadEvents(): Promise<{ events: Event[]; demo: boolean; error?: string }> {
  const tt = new TimTimEvents({ apiKey: process.env.TIMTIM_KEY });
  try {
    const { events } = await tt.events.list({ city: "Miami", category: "music", limit: 6 });
    return { events, demo: tt.mode === "demo" };
  } catch (error) {
    const message = error instanceof TimTimApiError ? `${error.title} (request ${error.requestId})` : "TimTim.Live could not be reached.";
    return { events: [], demo: tt.mode === "demo", error: message };
  }
}

export default async function Page() {
  const { events, demo, error } = await loadEvents();
  return (
    <main>
      <h1>Events in Miami</h1>
      <p>{demo ? "Demo mode: sample events, no real money. Set TIMTIM_KEY to use your key." : "Using your key from TIMTIM_KEY."}</p>
      {error ? <p role="alert">{error}</p> : null}
      {!error && events.length === 0 ? <p>No events here yet.</p> : null}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {events.map((event) => (
          <li key={event.id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: "12px 14px" }}>
            <strong>{event.name}</strong>
            <div>
              {event.display.date_label ?? event.date} · {[event.location.venue, event.location.city].filter(Boolean).join(", ")}
            </div>
            <div>{event.display.price_label}</div>
            {event.tickets.buy_url?.startsWith("https://") ? (
              <a href={event.tickets.buy_url} target="_blank" rel="noopener">
                Get tickets
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
