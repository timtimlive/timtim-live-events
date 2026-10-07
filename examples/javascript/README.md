# JavaScript examples

**Developer Preview.** The SDK (`@timtim-live/events`) in a Node script and in a browser page.

- [`node-example.mjs`](node-example.mjs) — Node 18 or newer.
- [`browser.html`](browser.html) — an ES module in a plain web page.

The npm package is **not published yet**, so these use the copy built in this repository.

## Try it

1. From the repository root: `npm ci`
2. Build the packages: `npm run build`
3. Run the Node example: `npm run start -w examples-javascript` — it prints sample events in Miami.
4. Optional, with your own test key (get one at https://timtim.live/partners/dashboard): `TIMTIM_KEY=tt_test_YOUR_KEY npm run start -w examples-javascript` — in PowerShell: `$env:TIMTIM_KEY="tt_test_YOUR_KEY"; npm run start -w examples-javascript`
5. Browser: `npm run serve -w examples-javascript`, then open the address it prints.

Never put a server key (`tt_sk_live_…`) in a browser page — the SDK refuses it there.

- Live Demo: https://timtim.live/developers/demo
- Documentation: https://timtim.live/developers/docs
- Sandbox: https://timtim.live/developers/sandbox
- Developer Access: https://timtim.live/developers
- Community: https://timtim.live/developers/community
