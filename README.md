# TimTim.Live Event SDK

> **Developer Preview.** Things work, and things may still change. The npm packages are **not published yet** — see [Install](#install).

[Live Demo](https://timtim.live/developers/demo) · [Documentation](https://timtim.live/developers/docs) · [Sandbox](https://timtim.live/developers/sandbox) · [Developer Access](https://timtim.live/developers) · [Community](https://timtim.live/developers/community)

## What it does

It puts a list of **live events** — concerts, festivals, parties, talks — on your website or in your app.

You say a city, like **Miami**. It shows the events happening there. Each event has a **Get tickets** button. That's it.

There are three pieces in this box:

| Piece | What it is | For |
|---|---|---|
| [`@timtim-live/events`](packages/events-js) | A small JavaScript library | Any JavaScript: Node, browsers, Deno, Bun, edge |
| [`@timtim-live/web-component`](packages/web-component) | A `<timtim-events>` tag | Any web page |
| [`@timtim-live/react`](packages/react) | `<TimTimEvents />` and `useTimTimEvents()` | React apps |

## Live Demo

See it working before you do anything: **https://timtim.live/developers/demo**

## Install

**The npm packages are not published yet.** Until they are, you have two choices:

1. **Nothing to install:** use the hosted widget (next section). It works today.
2. **Build from this repository** (Node 20.19 or newer for building; the built SDK runs on Node 18+):

```bash
git clone https://github.com/timtimlive/timtim-live-events.git
cd timtim-live-events
npm ci
npm run build
```

When the packages are published, installing will be:

```bash
npm install @timtim-live/events            # the SDK
npm install @timtim-live/web-component     # <timtim-events>
npm install @timtim-live/react             # React
```

## 60-second example

### 1. One line of HTML (works right now, nothing to install)

Paste this into any web page:

```html
<script src="https://timtim.live/widget/events.js" data-city="Miami" data-category="music" async></script>
```

Open the page. You will see events in Miami. They are **sample events** — each name starts with "TEST EVENT — NO REAL MONEY" — because you have not used a key yet. That is fine for trying.

You can change `data-city` and `data-category`, and add `data-limit`, `data-lang`, `data-color` or `data-key`.

### 2. The SDK (after `npm run build`, or once it is on npm)

```js
import { TimTimEvents } from "@timtim-live/events";

const tt = new TimTimEvents(); // no key = sample events
const { events } = await tt.events.list({ city: "Miami", category: "music" });

for (const event of events) {
  console.log(event.name, event.display.date_label, event.tickets.buy_url);
}
```

Try it from this repository: `npm run example:node`.

## Sandbox

When you want your own key:

1. Get a free **test key** (`tt_test_…`) at https://timtim.live/partners/dashboard. Test keys only ever see sample events. No real money moves.
2. Use it: `new TimTimEvents({ apiKey: "tt_test_YOUR_KEY" })`.
3. Practice the bad days without a key at all:

```js
await tt.demo.events.list({ simulate: "cancelled" });  // also: sold_out, rescheduled, postponed
await tt.demo.events.list({ simulate: "rate_limited" }); // throws TimTimApiError, status 429, retryAfter 30
```

More: https://timtim.live/developers/sandbox

**Which key goes where**

| Key | Where it may go |
|---|---|
| `tt_test_…` | Anywhere. Sample events only. |
| `tt_pk_live_…` (website key) | Browsers. Locked to your domains. |
| `tt_sk_live_…` (server key) | **Only your server.** The SDK refuses to run with it in a browser. |

## More examples

| Folder | What you'll see |
|---|---|
| [`examples/html`](examples/html) | The one-line hosted widget, and the `<timtim-events>` tag |
| [`examples/javascript`](examples/javascript) | The SDK in a Node script and in a browser page |
| [`examples/react`](examples/react) | A Vite + React app with a city picker |
| [`examples/nextjs`](examples/nextjs) | Next.js App Router, rendered on the server |

Each folder has a README with 3–5 steps. For examples that use the raw API with no SDK, see [timtim-api-examples](https://github.com/timtimlive/timtim-api-examples).

### Everything the SDK can do

Only what the [API contract](https://timtim.live/partner-api/openapi.yaml) has — nothing invented.

| Method | API operation | Needs a key? |
|---|---|---|
| `events.list(params)` | `GET /events` (no key: `GET /demo/events`) | No |
| `events.iterate(params)` | pages of `GET /events`, following `next` | No |
| `events.get(id)` | `GET /events/{id}` | Yes |
| `events.changedSince(time, params?)` | `GET /events?changed_since=` | Yes |
| `demo.events.list(params)` | `GET /demo/events` (with `simulate`) | Never |
| `tickets.list(eventId)` | `GET /events/{id}/tickets` | Server or test key |
| `orders.create(body, { idempotencyKey })` | `POST /orders` | Server or test key |
| `orders.get(id)` | `GET /orders/{id}` | Server or test key |
| `earnings.list()` | `GET /earnings` | Server or test key |
| `offers.list(params)` | `GET /offers` | Server or test key |
| `settlements.list()` | `GET /settlements` | Server or test key |
| `feeds.url(format, params)` | builds `/feeds/events.{format}?key=` | Website or test key |
| `verifyWebhook({ secret, header, body })` | checks `TimTim-Signature` | — |

Errors from the API become `TimTimApiError` with `status`, `code`, `title`, `detail`, `requestId` and `retryAfter`.

## Documentation

- Docs: https://timtim.live/developers/docs
- 60-second quickstart: https://timtim.live/developers/quickstart
- API contract (OpenAPI 3.1): https://timtim.live/partner-api/openapi.yaml — also in [timtim-openapi](https://github.com/timtimlive/timtim-openapi)
- Status: https://timtim.live/developers/status
- Package READMEs: [events](packages/events-js/README.md) · [web-component](packages/web-component/README.md) · [react](packages/react/README.md)

## Security

Found a security problem? Please **do not** open a public issue. Use **Report a vulnerability** on this repository's [Security tab](https://github.com/timtimlive/timtim-live-events/security) (GitHub private vulnerability reporting). Policy: https://timtim.live/partners/security — and see [SECURITY.md](SECURITY.md).

## Contribution

Ideas, bug reports and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Everyone here follows the [Code of Conduct](CODE_OF_CONDUCT.md). Questions: [SUPPORT.md](SUPPORT.md) and https://timtim.live/developers/community.

For developers of this repository:

```bash
npm ci
npm run lint
npm run build
npm run typecheck
npm test                  # unit tests, no network
npm run test:integration  # calls the real keyless demo endpoint
npm run check:generated   # types match openapi.yaml
```

## TimTim.Live Developer Tools

Open-source tools for connecting websites, apps and platforms to TimTim.Live.

### What is open source

SDKs, widgets, adapters, examples and public API specifications.

### What is not included

The hosted TimTim.Live Event API implementation, production databases, ticketing backend, checkout systems, attribution systems, payouts, fraud systems, customer data, infrastructure and proprietary business logic are not part of this repository.

These tools connect to the hosted TimTim.Live API at:

https://api.timtim.live

Open-source licenses for client software do not grant ownership of TimTim.Live event data, API services, commercial rights, certification marks or trademarks.

## License

[MIT](LICENSE) © 2026 timtim-live. Using the TimTim.Live API is covered by the Partner Terms: https://timtim.live/partners/terms
