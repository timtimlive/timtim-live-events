# TimTim.Live Events for Wix

| Way | Status |
|---|---|
| **Custom Element** — the real `<timtim-events>` on your page, settings as attributes | **Works today** on sites where Wix allows custom elements (a premium plan with a connected domain) |
| **Embed HTML** — paste the code into an Embed box | **Works today** (it draws inside a frame) |
| **A TimTim.Live app in the Wix App Market** — add and configure visually | **Not built yet.** It needs a TimTim.Live Wix developer account; see [MARKETPLACES.md](../MARKETPLACES.md) |

Both working ways load the hosted embed (`https://timtim.live/embed/v1/timtim-events.js`).

## Install

**Custom Element (recommended):**

1. In the Wix Editor: **Add Elements → Embed Code → Custom Element**.
2. Click **Choose Source** → **Server URL** → paste `https://timtim.live/embed/v1/timtim-events.js`.
3. **Tag Name**: `timtim-events`.
4. **Set Attributes** → add `location` = `Miami,US`, `category` = `music` (and any others below).
5. Resize the box, then **Publish**.

**Embed HTML:** Add Elements → Embed Code → **Embed HTML** → **Code** → paste the code from https://timtim.live/developers/widget → **Update**.

## 5-minute example

Embed HTML:

```html
<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>
<timtim-events location="Miami,US" category="music" limit="6"></timtim-events>
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

Screenshot the Custom Element's settings (source URL, tag name, attributes) and the published page.

## Troubleshooting

- **"Custom Element" is greyed out** — Wix allows it only with a premium plan and a connected domain; use Embed HTML instead.
- **Box is cut off (Embed HTML)** — make the box taller, or set `limit` lower or `layout="compact"`.
- **Website key shows nothing** — add your Wix domain to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Wix Editor and Wix Studio.

## Test plan

The embed itself is tested in `packages/web-component`. Manually: add the Custom Element with the attributes above on a premium test site; publish; check events and the "Get tickets" link.
