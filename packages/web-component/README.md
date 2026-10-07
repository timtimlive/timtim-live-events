# @timtim-live/web-component

> **Developer Preview.** Not published to npm yet. **Until it is, the zero-install way is the hosted widget:**
>
> ```html
> <script src="https://timtim.live/widget/events.js" data-city="Miami" data-category="music" async></script>
> ```

`<timtim-events>` — a tag that shows TimTim.Live events on any web page. Built on [`@timtim-live/events`](../events-js).

[Live Demo](https://timtim.live/developers/demo) · [Documentation](https://timtim.live/developers/docs) · [Sandbox](https://timtim.live/developers/sandbox) · [Developer Access](https://timtim.live/developers) · [Community](https://timtim.live/developers/community)

## Use

With a bundler (once published):

```js
import "@timtim-live/web-component";
```

Or one file for a plain `<script>` tag — `dist/timtim-events.global.js` (made by `npm run build`):

```html
<script src="timtim-events.global.js"></script>
<timtim-events city="Miami" category="music"></timtim-events>
```

## Attributes

| Attribute | Meaning |
|---|---|
| `city`, `country`, `category` | Filters, as in the API |
| `limit` | How many (1–100, default 6) |
| `key` | A website key (`tt_pk_live_…`) or test key. No key = sample events. **Never a server key** — it is refused. |
| `lang` | Language for dates and prices (words are English unless you set `.labels`) |
| `color` | Button color, hex only (`#0e7490`) |
| `simulate` | Without a key: `sold_out`, `cancelled`, `rescheduled`, `postponed`, `invalid_key`, `rate_limited` |

Changing any attribute fetches again. Events: `timtim-events-loaded` (`detail.events`) and `timtim-events-error` (`detail.error`). Method: `refresh()`. Style hook: `::part(container)`.

## Safety and access

- Drawn inside a shadow root; your CSS cannot break it and it cannot break yours.
- Text is set with `textContent` only. An event name can never become markup.
- Only `https:` links and images are used; anything else is left out.
- A list with a name, real links with names ("Get tickets: …"), a real `<button>` to retry, visible focus.

## License

MIT © 2026 timtim-live
