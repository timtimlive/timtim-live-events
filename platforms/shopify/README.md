# TimTim.Live Events for Shopify

Show live events on a Shopify store. Two ways:

| Way | Status |
|---|---|
| **Custom Liquid section** — paste one piece of code in the theme editor | **Works today**, no app needed |
| **TimTim.Live Events app block** — Add block → Apps → TimTim.Live Events, every setting in the side panel | Built here (`extensions/timtim-events`). **Not in the Shopify App Store yet**: it needs a TimTim.Live Shopify Partner account, `shopify app deploy`, and Shopify's review — see [MARKETPLACES.md](../MARKETPLACES.md) |

Both load the hosted TimTim.Live embed (`https://timtim.live/embed/v1/timtim-events.js`). No event data passes through Shopify, and the app asks for **no** Admin API access.

## Install

**Today (Custom Liquid):**

1. Make your code at https://timtim.live/developers/widget (choose city, type, layout; copy).
2. Shopify admin → **Online Store → Themes → Customize**.
3. **Add section → Custom Liquid**, paste the code, **Save**.

**With the app (once listed):** install TimTim.Live Events from the App Store, then in the theme editor **Add block → Apps → TimTim.Live Events**.

## 5-minute example

Paste into a Custom Liquid section:

```html
<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>
<timtim-events location="Miami,US" category="music" limit="6"></timtim-events>
```

Sample events show straight away. Add `partner="tt_pk_live_…"` (your website key) for real events and click counts.

## Settings

The app block's side panel (the Custom Liquid code takes the same values as attributes):

| Setting | Attribute | Meaning |
|---|---|---|
| Heading | — | Title above the events |
| Location | `location` | `City` or `City,CC` |
| Event type | `category` | Any, Music, Festival, Nightlife, Conference |
| How many | `limit` | 1–24 |
| Layout | `layout` | Cards, List, Compact |
| Colors | `theme` | Light, Dark, Match visitor |
| Button color | `color` | Hex color |
| Show pictures / prices | `show-images` / `show-price` | Off writes `"false"` |
| TimTim.Live website key | `partner` | Optional. Only `tt_pk_live_…` or `tt_test_…` is ever written; a server key is ignored |

The store's language is passed as `lang`, so dates and prices follow it.

## Screenshot / demo

Open the theme editor with the block added and take a screenshot of the side panel and the preview. Without a key the cards say **Sample — no real money**.

## Troubleshooting

- **Nothing shows** — check the theme editor's preview, not the code editor; the embed draws after the page loads.
- **Every event says TEST EVENT** — no key; add your website key.
- **Website key shows nothing on the live store** — add your store's domain (and `myshopify.com` domain) to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Online Store 2.0 themes (app blocks need sections everywhere; Dawn and every current Shopify theme). Custom Liquid works on any theme with that section.

## Test plan

`npm test` renders the real block with a Liquid engine (liquidjs): every setting reaches `<timtim-events>`, the store language becomes `lang`, typed values are escaped, a website/test key is written and a server key never is, and the schema has a section target with labelled settings. Before submitting: deploy to a development store and add the block in the theme editor.
