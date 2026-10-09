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

Or install nothing at all. TimTim.Live hosts this exact build at a stable address (the same bytes `npm run build` makes in `dist/timtim-events.global.js`):

```html
<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>
<timtim-events location="Miami,US" category="music" partner="tt_test_…"></timtim-events>
```

`/embed/v1/` only ever grows: new optional attributes, never a renamed or removed one. A breaking change would ship as `/embed/v2/`.

## Attributes

| Attribute | Meaning |
|---|---|
| `city`, `country`, `category` | Filters, as in the API |
| `location` | `City` or `City,CC` — a shortcut for `city` + `country` (`Paris,FR`) |
| `limit` | How many (1–100, default 6) |
| `partner` | Your website key (`tt_pk_live_…`) or test key. No key = sample events. **Never a server key** — it is refused. `key` is the older name and still works. |
| `layout` | `grid` (default), `list` or `compact` |
| `theme` | `light` (default), `dark` or `auto` (follows the visitor's system) |
| `show-images`, `show-price` | `false` hides them |
| `tracking` | `off` sends nothing (see below) |
| `lang` | Language for dates and prices (words are English unless you set `.labels`) |
| `color` | Button color, hex only (`#0e7490`) |
| `simulate` | Without a key: `sold_out`, `cancelled`, `rescheduled`, `postponed`, `invalid_key`, `rate_limited` |

Changing any attribute fetches again. Events: `timtim-events-loaded` (`detail.events`) and `timtim-events-error` (`detail.error`). Method: `refresh()`. Style hook: `::part(container)`.

## Tracking

The element tells TimTim.Live (`POST /v1/track`) what people saw and clicked, so your dashboard can count it. It sends one `impression` when events are shown. It sends an `event_view` when a card comes into view, and an `event_click` when "Get tickets" is pressed. It is sent with `navigator.sendBeacon` and never delays or breaks the list. It carries no cookie and nothing about the visitor. It carries only the event id, your key and a random id made once per page load. It is never money: sales are recorded by TimTim.Live itself. Nothing is sent with `tracking="off"` or while `simulate` is set.

## Safety and access

- Drawn inside a shadow root; your CSS cannot break it and it cannot break yours.
- Text is set with `textContent` only. An event name can never become markup.
- Only `https:` links and images are used; anything else is left out.
- A list with a name, real links with names ("Get tickets: …"), a real `<button>` to retry, visible focus.

## License

MIT © 2026 timtim-live
