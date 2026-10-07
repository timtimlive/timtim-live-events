# React example (Vite)

**Developer Preview.** `@timtim-live/react` in a small Vite app: `<TimTimProvider>` plus `<TimTimEvents city="…" />`, with a city picker and a "pretend" picker for bad days (sold out, cancelled, too many requests).

The npm package is **not published yet**, so this uses the copy built in this repository.

## Try it

1. From the repository root: `npm ci`
2. Build the packages: `npm run build`
3. Start the app: `npm run dev -w examples-react`
4. Open the address it prints (usually http://localhost:5173). You will see sample events in Miami.
5. Optional: put `VITE_TIMTIM_KEY=tt_test_YOUR_KEY` in `examples/react/.env.local` to use your own test key. Never a server key — a browser can be read by anyone.

- Live Demo: https://timtim.live/developers/demo
- Documentation: https://timtim.live/developers/docs
- Sandbox: https://timtim.live/developers/sandbox
- Developer Access: https://timtim.live/developers
- Community: https://timtim.live/developers/community
