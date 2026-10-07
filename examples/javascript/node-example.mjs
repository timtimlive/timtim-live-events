// Find events with the TimTim.Live SDK, from Node 18+.
//
//   node node-example.mjs                       sample events, no key
//   TIMTIM_KEY=tt_test_... node node-example.mjs   with your own test key
//
import { TimTimEvents, TimTimApiError } from "@timtim-live/events";

const tt = new TimTimEvents({ apiKey: process.env.TIMTIM_KEY });
console.log(tt.mode === "demo" ? "No key: showing sample events (demo mode)." : "Using your key.");

try {
  const { events } = await tt.events.list({ city: "Miami", category: "music", limit: 5 });
  if (events.length === 0) console.log("No events found.");
  for (const event of events) {
    console.log(`- ${event.name}`);
    console.log(`  ${event.display.date_label ?? event.date} · ${event.location.venue ?? ""}, ${event.location.city ?? ""}`);
    console.log(`  ${event.display.price_label ?? ""}  ${event.tickets.buy_url ?? ""}`);
  }
} catch (error) {
  if (error instanceof TimTimApiError) {
    console.error(`TimTim.Live said: ${error.title} (${error.status}, ${error.code}). Request id: ${error.requestId}`);
    if (error.retryAfter) console.error(`Try again in ${error.retryAfter} seconds.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
