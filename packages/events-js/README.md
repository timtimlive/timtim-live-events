# @timtim-live/events

> **Developer Preview.** Not published to npm yet — build it from [the repository](https://github.com/timtimlive/timtim-live-events) for now.

Find and show live events from TimTim.Live in any JavaScript app. Zero dependencies. Uses the global `fetch`, so it runs in Node 18+, browsers, Deno, Bun and edge runtimes.

[Live Demo](https://timtim.live/developers/demo) · [Documentation](https://timtim.live/developers/docs) · [Sandbox](https://timtim.live/developers/sandbox) · [Developer Access](https://timtim.live/developers) · [Community](https://timtim.live/developers/community)

## Install

```bash
npm install @timtim-live/events   # once published
```

## Use

```js
import { TimTimEvents } from "@timtim-live/events";

// No key: demo mode — sample events, no sign-up.
const tt = new TimTimEvents();
const { events, next } = await tt.events.list({ city: "Miami", category: "music" });

// With a key (a test key from https://timtim.live/partners/dashboard):
const mine = new TimTimEvents({ apiKey: process.env.TIMTIM_KEY });
```

Options: `apiKey`, `baseUrl` (default `https://api.timtim.live/v1`), `fetch`, `timeoutMs` (default 30000), `retries` (default 0), `maxRetryDelayMs` (default 10000).

**Try again by itself.** Sometimes the internet hiccups. Set `retries: 2` and the client asks up to two more times. It does that when there was no answer, or when TimTim.Live said "busy" (429, 502, 503 or 504). It waits a little longer each time. If TimTim.Live says how long to wait, it waits that long. It never retries a mistake, like a wrong key, and it never repeats an order.

```js
const tt = new TimTimEvents({ apiKey, retries: 2 });
```

### Every page

```js
for await (const page of tt.events.iterate({ city: "Paris" })) {
  for (const event of page.events) console.log(event.name);
}
```

### What changed (keep your copy in sync)

```js
const { events, withdrawn } = await mine.events.changedSince("2026-10-06T10:00:00Z");
// update every event; stop showing every id in `withdrawn`
```

### Bad days, on purpose (no key needed)

```js
await tt.demo.events.list({ simulate: "cancelled" }); // sold_out, cancelled, rescheduled, postponed
await tt.demo.events.list({ simulate: "invalid_key" }); // throws TimTimApiError 401
```

### Errors

```js
import { TimTimApiError } from "@timtim-live/events";

try {
  await mine.events.get("evt_test_washington_konpa");
} catch (e) {
  if (e instanceof TimTimApiError) console.log(e.status, e.code, e.title, e.detail, e.requestId, e.retryAfter);
}
```

`TimTimError` (the parent class) covers problems before the API answers: `key_required`, `secret_key_in_browser`, `invalid_argument`, `network_error`, `timeout`.

### Webhooks

```js
import { verifyWebhook } from "@timtim-live/events";

// rawBody = the request body exactly as received (do not JSON.parse first)
const ok = await verifyWebhook({ secret: process.env.TIMTIM_WEBHOOK_SECRET, header: req.headers["timtim-signature"], body: rawBody });
if (!ok) return res.status(400).end();
// then skip deliveries you already handled, using the TimTim-Delivery-Id header
```

It checks the seal on each message, and refuses messages more than 300 seconds old (`toleranceS`). You don't need to know how. For the curious: it checks `t=<seconds>,v1=<hex>`, an HMAC-SHA256 over `` `${t}.${body}` ``, compared in constant time.

### Embedded commerce, results, feeds (server or test keys)

```js
await mine.tickets.list("evt_test_washington_konpa");
await mine.orders.create(
  { event_id: "evt_test_washington_konpa", ticket_type_id: "tt_test_washington_konpa", quantity: 1, buyer_email: "buyer@example.com", buyer_name: "A Buyer" },
  { idempotencyKey: "order-0001" },
);
await mine.orders.get("ord_…");
await mine.earnings.list();
await mine.offers.list({ country: "US" });
await mine.settlements.list();
mine.feeds.url("ics", { city: "Paris" }); // website or test key only — a server key never goes in a URL
```

## Keys and safety

- `tt_sk_live_…` (server key) and `tt_at_…` (OAuth access token) are **refused in a browser**: the constructor throws `secret_key_in_browser`.
- With no key, only `events.list`, `events.iterate` and `demo.events.list` work; everything else throws `key_required` and tells you where to get a key.
- With no key, the demo works on any website. Browsers do not block it, because the SDK sends only headers every browser allows (CORS-safelisted).

## Types

Every type is generated from the API contract ([`openapi.yaml`](openapi.yaml)) with `openapi-typescript`. The types are `Event`, `EventList`, `Earning`, `Order`, `TicketType`, `Offer`, `Settlement`, `Problem`, `EventChangedMessage`, `EarningsChangedMessage`, and the raw `paths`, `components`, `operations`, `webhooks`.

## License

MIT © 2026 timtim-live
