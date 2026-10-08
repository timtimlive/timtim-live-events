# TimTim.Live Events for Webflow

| Way | Status |
|---|---|
| **Code Embed element** — paste one piece of code | **Works today** on site plans that allow custom code |
| **A TimTim.Live component in the Webflow Marketplace** — place and configure visually | **Not built yet.** It needs a TimTim.Live Webflow developer workspace; see [MARKETPLACES.md](../MARKETPLACES.md) |

The embed is `https://timtim.live/embed/v1/timtim-events.js`.

## Install

1. Make your code at https://timtim.live/developers/widget.
2. In the Designer: **Add (+) → Components → Code Embed**, drop it where events should go.
3. Paste the code → **Save & Close** → **Publish**.

## 5-minute example

```html
<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>
<timtim-events location="Montreal,CA" category="music" layout="list"></timtim-events>
```

## Settings

| Attribute | Meaning |
|---|---|
| `location` | `City` or `City,CC` |
| `category` | music, festival, nightlife, conference |
| `limit` | 1–100 |
| `layout` | grid, list, compact |
| `theme` | light, dark, auto |
| `color` | Hex button color |
| `show-images`, `show-price` | `false` hides them |
| `partner` | Your website key (`tt_pk_live_…`). Never a server key |

## Screenshot / demo

Screenshot the Code Embed in the Designer and the published page (the Designer canvas does not run scripts).

## Troubleshooting

- **Blank in the Designer** — normal; scripts run on the published site or in Preview.
- **Website key shows nothing** — add your `webflow.io` and custom domains to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Webflow sites on plans that allow custom code embeds.

## Test plan

The embed itself is tested in `packages/web-component`. Manually: add the Code Embed to a test site, publish, check events and the "Get tickets" link.
