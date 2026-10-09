# Changelog

All notable changes to this repository. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `@timtim-live/events`: `retries` and `maxRetryDelayMs` options (default 0: off). A failed GET is tried again on no answer, a timeout, 429, 502, 503 or 504, after a growing random wait or the server's `Retry-After` when it fits under `maxRetryDelayMs`. Never a POST. `retryDelayMs()` is exported.
- `@timtim-live/web-component`: waits at most 8 seconds (was 30) and tries a failed load twice more before showing the error.
- `platforms/`: Shopify theme app block, Framer code component, Drupal 10/11 module, Joomla 4/5 module, Bubble plugin element code, and step-by-step Wix, Webflow and Squarespace guides — all on the hosted embed, none asking for platform permissions. `platforms/MARKETPLACES.md` says what each listing still needs. Tests: Liquid-rendered Shopify block, Framer component, Bubble element, README and key checks; CI lints and tests the PHP.
- Mobile: `@timtim-live/react-native` (`<TimTimEventList />`, the shared hook, ticket links via `Linking`, view/tap counting); a Swift package (`mobile/ios`, async/await, `Codable`) and a Kotlin client (`mobile/android`, kotlinx.serialization); `npm run check:mobile` fails CI if their models drift from the contract; CI builds and tests Swift on macOS and Kotlin on Linux.
- `@timtim-live/mcp`: a read-only MCP server (stdio) with `find_events`, `find_events_near_location`, `find_events_by_category`, `get_event`, `list_categories`, `list_locations`; `timtim-mcp` command; sample events without a key. TimTim.Live also hosts the same tools at `https://api.timtim.live/v1/mcp`.
- `@timtim-live/events`: `categories.list()` and `locations.list()` (with a key, or sample counts without one), `demo.categories.list()`, `demo.locations.list()`, and `track()` — a fire-and-forget `impression` / `event_view` / `event_click` signal that never throws and is never money.
- `@timtim-live/web-component`: attributes `location`, `partner` (the old `key` still works), `layout`, `theme`, `show-images`, `show-price`, `tracking`; impression, view and click tracking by beacon. Hosted at `https://timtim.live/embed/v1/timtim-events.js`.

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
