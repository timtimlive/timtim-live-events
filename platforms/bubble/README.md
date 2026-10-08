# TimTim.Live Events for Bubble

| Way | Status |
|---|---|
| **HTML element** — paste one piece of code | **Works today** |
| **TimTim.Live Events plugin** — a visual element with fields, an `event_count` state and `events_loaded` / `events_failed` events for workflows | Source here ([`plugin-element/`](./plugin-element)). **Not in the Bubble plugin store yet**: plugins are built in Bubble's own plugin editor under a TimTim.Live Bubble account; see [MARKETPLACES.md](../MARKETPLACES.md) |

Both load the hosted embed (`https://timtim.live/embed/v1/timtim-events.js`); no API calls from Bubble workflows are needed.

## Install

**Today (HTML element):**

1. Make your code at https://timtim.live/developers/widget.
2. In the Bubble editor: **Visual elements → HTML**, draw it on the page.
3. Paste the code into the HTML element → Preview.

**Building the plugin (TimTim.Live's Bubble account):**

1. Bubble → **Plugins → Create a new plugin** → name it *TimTim.Live Events*.
2. **Shared → HTML header**: `<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>`
3. **Elements → New element** *TimTim Events* → add the fields listed at the top of [`update.js`](./plugin-element/update.js).
4. **Exposed states**: `event_count` (number). **Events**: `events_loaded`, `events_failed`.
5. Paste [`initialize.js`](./plugin-element/initialize.js) and [`update.js`](./plugin-element/update.js) into the element's actions.
6. Test in a Bubble test app, then submit to the plugin store.

## 5-minute example

HTML element:

```html
<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>
<timtim-events location="Paris,FR" category="festival"></timtim-events>
```

With the plugin: drop *TimTim Events*, set Location `Paris,FR`, add a workflow "When TimTim Events events_loaded → Show a message: TimTim Events's event_count events".

## Settings

| Field | Meaning |
|---|---|
| location | `City` or `City,CC` |
| category | music, festival, nightlife, conference |
| limit | 1–100 |
| layout | grid, list, compact |
| theme | light, dark, auto |
| color | Hex button color |
| show_images, show_price | No hides them |
| partner_key | Your website key (`tt_pk_live_…`). A server key is ignored |

## Screenshot / demo

Screenshot the element's property editor and the preview page.

## Troubleshooting

- **HTML element shows the code as text** — make sure it is an HTML element, not a Text element.
- **Website key shows nothing** — add your `bubbleapps.io` and custom domains to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Any Bubble app. The plugin code uses only Bubble's documented element API (`instance.canvas`, `instance.data`, `publishState`, `triggerEvent`).

## Test plan

The embed itself is tested in `packages/web-component`; `npm test` checks the plugin code keeps server keys out and points at the hosted embed. Manually: build the plugin in a test app, change each field, and check the `events_loaded` workflow fires.
