# HTML examples

**Developer Preview.** Two pages that show TimTim.Live events with no JavaScript of your own.

| Page | What it uses | Needs |
|---|---|---|
| [`index.html`](index.html) | The hosted widget — one `<script>` line from `https://timtim.live/widget/events.js` | Nothing. Works today. |
| [`web-component.html`](web-component.html) | `<timtim-events>` from [`packages/web-component`](../../packages/web-component) | `npm run build` first (the npm package is not published yet) |

## Try it

1. **Hosted widget:** open `index.html` in your browser (double-click it). You will see sample events in Miami.
2. **Web component:** from the repository root, run `npm ci` and then `npm run build`.
3. Run `npm run start -w examples-html` and open the address it prints.
4. Click **web-component.html**. Change the city — the list fetches again.
5. Pick **Pretend: cancelled** to see how a cancelled event looks.

Everything here uses the keyless demo, so every event says **TEST EVENT — NO REAL MONEY**.

- Live Demo: https://timtim.live/developers/demo
- Documentation: https://timtim.live/developers/docs
- Sandbox: https://timtim.live/developers/sandbox
- Developer Access: https://timtim.live/developers
- Community: https://timtim.live/developers/community
