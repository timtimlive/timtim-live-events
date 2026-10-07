# Changelog

All notable changes to this repository. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — Developer Preview (unreleased)

Not published to npm yet.

### Added

- `@timtim-live/events`: `TimTimEvents` client with demo mode (no key), `events.list`, `events.get`, `events.iterate`, `events.changedSince`, `demo.events.list` (with `simulate`), `tickets.list`, `orders.create` (Idempotency-Key), `orders.get`, `earnings.list`, `offers.list`, `settlements.list`, `feeds.url`.
- `verifyWebhook()` — Web Crypto HMAC-SHA256 check of `TimTim-Signature`, constant-time comparison, 300-second replay window.
- `TimTimApiError` (status, code, title, detail, requestId, retryAfter) and `TimTimError`.
- Server keys (`tt_sk_live_…`) and OAuth access tokens (`tt_at_…`) are refused in browsers.
- Types generated from the API contract with `openapi-typescript`, with a freshness check.
- `@timtim-live/web-component`: `<timtim-events>` custom element and a single-file `timtim-events.global.js`.
- `@timtim-live/react`: `<TimTimEvents>`, `useTimTimEvents()`, `<TimTimProvider>`.
- Examples: HTML (hosted widget + web component), JavaScript (Node + browser), React (Vite), Next.js (App Router).
