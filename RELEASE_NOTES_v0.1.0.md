# TimTim.Live Event SDK v0.1.0 — Developer Preview

The first public version of the tools for putting live events from TimTim.Live into any website or app.

**Developer Preview:** things work and are tested; names and shapes may still change before 1.0. The npm packages are **not published yet** — build them from this repository.

## WORKING NOW

- **One line of HTML**, no key, no install:
  `<script src="https://timtim.live/widget/events.js" data-city="Miami" data-category="music" async></script>`
- **Keyless demo endpoint** — `GET https://api.timtim.live/v1/demo/events` — sample events, CORS `*`, plus `simulate=sold_out|cancelled|rescheduled|postponed|invalid_key|rate_limited`.
- **`@timtim-live/events`** — zero-dependency client for every operation in the API contract that a partner calls: find events, one event, every page, what changed, ticket types, sandbox orders, earnings, offers, settlements, feed URLs.
- **`verifyWebhook()`** — checks `TimTim-Signature` with Web Crypto, in constant time, with a 300-second replay window.
- **Safety by default** — server keys refused in browsers; event text never becomes markup; https-only links.
- **`<timtim-events>`** web component and **`@timtim-live/react`** (`<TimTimEvents>`, `useTimTimEvents`, `<TimTimProvider>`).
- **Types generated from the OpenAPI 3.1 contract**, with a CI check that fails if they drift.
- **Examples that run:** HTML, JavaScript (Node + browser), React (Vite), Next.js (App Router).

## COMING LATER

- Publishing to npm with provenance (the workflow is ready; nothing has been published).
- Translated component labels.
- Helpers for OAuth tokens and bulk feeds.

## Links

- Live demo: https://timtim.live/developers/demo
- Quickstart: https://timtim.live/developers/quickstart
- Documentation: https://timtim.live/developers/docs
- GitHub: https://github.com/timtimlive/timtim-live-events
- Community: https://timtim.live/developers/community
- Status: https://timtim.live/developers/status
