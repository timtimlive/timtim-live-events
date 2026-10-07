# Roadmap

An honest list. **Working now** means it exists in this repository and its tests pass. **Coming later** means it does not exist yet.

## Working now

- The hosted widget — one `<script>` line from https://timtim.live/widget/events.js — with no key and no install.
- The keyless demo endpoint (`GET /v1/demo/events`) with `simulate` for bad days.
- `@timtim-live/events` built from this repository: every operation listed in the README, typed from the API contract.
- Webhook verification with Web Crypto (Node 18+, browsers, Deno, Bun, edge).
- `<timtim-events>` web component and its single-file bundle, built from this repository.
- `@timtim-live/react` built from this repository.
- Four examples that run: HTML, JavaScript, React (Vite), Next.js.

## Coming later

- Publishing the three packages to npm (the release workflow is ready; nothing is published yet).
- Translated words for `<timtim-events>` and `<TimTimEvents>` (the hosted widget already has them; the packages are English unless you pass `labels`).
- Helpers for the OAuth client-credentials token and the bulk feed (`/bulk/{file}`) — both exist in the API today and can be called directly.
- More frameworks, if people ask for them: open an **Integration request** issue.

Nothing here is a promise of a date.
