# TimTim.Live Events for Framer

A Framer code component with every setting in the property panel. **Works today** — no marketplace needed.

## Install

1. In Framer: **Assets → Code → New Code File** (name it `TimTimEvents`).
2. Replace its contents with [`TimTimEvents.tsx`](./TimTimEvents.tsx) from this folder. Save.
3. Drag **TimTim Events** from Assets onto your page.

## 5-minute example

After step 3, set **Location** to `Paris,FR` and **Type** to Festival in the right-hand panel. Publish. Sample events show straight away; put your website key in **Partner key** for real events and click counts.

## Settings

| Panel control | Meaning |
|---|---|
| Location | `City` or `City,CC` |
| Type | Any, Music, Festival, Nightlife, Conference |
| How many | 1–24 |
| Layout | Cards, List, Compact |
| Colors | Light, Dark, Match visitor |
| Button color | Hex color, for example `#0e7490` |
| Pictures / Prices | On or off |
| Partner key | Optional. Only `tt_pk_live_…` or `tt_test_…` is used; a server key is ignored |

The component loads the hosted embed (`https://timtim.live/embed/v1/timtim-events.js`) and passes these settings to `<timtim-events>`. It fetches nothing itself.

## Screenshot / demo

Select the component on the canvas: the property panel shows the controls above. Preview (▶) shows the events.

## Troubleshooting

- **Empty box on the canvas** — Framer's canvas may not run scripts; use Preview or the published site.
- **Button color ignored** — use a hex value (`#ff0066`), not a color name.
- **Website key shows nothing** — add your Framer domain to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Framer sites with code components (React 18+).

## Test plan

`npm test` renders the component with Framer's API replaced by a stand-in: the property controls, settings reaching `<timtim-events>`, updates when a setting changes, the hosted embed loaded once, no server key passed, non-hex colors dropped.
