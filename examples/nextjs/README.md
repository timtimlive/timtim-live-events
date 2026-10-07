# Next.js example (App Router)

**Developer Preview.** A server component that lists events with `@timtim-live/events`. The call runs on the server, so your key never reaches the browser.

- No `TIMTIM_KEY` → demo mode: sample events, no sign-up.
- `TIMTIM_KEY=tt_test_…` → your sandbox key. On a server, a server key (`tt_sk_live_…`) is fine too.

The npm package is **not published yet**, so this uses the copy built in this repository.

## Try it

1. From the repository root: `npm ci`
2. Build the packages: `npm run build`
3. Start Next.js: `npm run dev -w examples-nextjs`
4. Open http://localhost:3000 — you will see sample events in Miami.
5. Optional: create `examples/nextjs/.env.local` with `TIMTIM_KEY=tt_test_YOUR_KEY` (get one at https://timtim.live/partners/dashboard) and restart.

- Live Demo: https://timtim.live/developers/demo
- Documentation: https://timtim.live/developers/docs
- Sandbox: https://timtim.live/developers/sandbox
- Developer Access: https://timtim.live/developers
- Community: https://timtim.live/developers/community
