# TimTim.Live Events for Joomla

A Joomla site module you place in any template position. **Works today** from this repository; not yet in the Joomla Extensions Directory (see [MARKETPLACES.md](../MARKETPLACES.md)).

## Install

1. Zip the `mod_timtim_events` folder (the zip must contain `mod_timtim_events.xml` at its top).
2. **System → Install → Extensions → Upload Package File** → choose the zip.
3. **Content → Site Modules → New → TimTim.Live Events** → choose your settings and a **Position** → **Save & Close**.

## 5-minute example

Create the module with Location `Miami,US`, Event type Music, Position `sidebar-right`, Menu Assignment "On all pages". Visit the site: sample events show straight away. Put your website key in the module settings for real events and click counts.

## Settings

| Module setting | Meaning |
|---|---|
| Location | `City` or `City,CC` |
| Event type | Any, Music, Festival, Nightlife, Conference |
| How many | 1–24 |
| Layout | Cards, List, Compact |
| Colors | Light, Dark, Match visitor |
| Button color | Color picker |
| Show pictures / Show prices | Yes or No |
| TimTim.Live website key | Optional. Only `tt_pk_live_…` or `tt_test_…` is ever written; a server key is ignored |

The module renders one `<timtim-events>` element, with every name and value escaped. It loads the hosted embed through Joomla's Web Asset Manager (`https://timtim.live/embed/v1/timtim-events.js`, deferred). Joomla fetches and stores no event data and needs no secret.

## Screenshot / demo

Screenshot the module's settings tab and the page with the module in its position.

## Troubleshooting

- **Module not showing** — check its Position exists in your template and Menu Assignment includes the page.
- **Every event says TEST EVENT** — no key; add your website key.
- **Website key shows nothing** — add your domain to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Joomla 4 and 5, PHP 8.1+.

## Test plan

CI lints every PHP file (`php -l`) and runs `php platforms/joomla/test/helper_test.php`. It checks defaults, every setting and the limit cap. A website key is written; a server key never is. Unknown values are dropped, values are escaped, and the hosted embed address is right. Before the JED: install on Joomla 4 and 5 and place the module.
