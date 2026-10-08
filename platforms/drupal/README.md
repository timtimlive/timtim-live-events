# TimTim.Live Events for Drupal

A Drupal module with a **TimTim.Live Events** block you place from Block layout. **Works today** from this repository; not yet on drupal.org (see [MARKETPLACES.md](../MARKETPLACES.md)).

## Install

1. Copy the `timtim_events` folder into your site's `modules/custom/` (or zip it and use **Extend → Add new module** where your site allows uploads).
2. **Extend** → tick **TimTim.Live Events** → **Install**.
3. **Structure → Block layout** → **Place block** next to a region → **TimTim.Live Events** → choose your settings → **Save block**.

With Drush: `drush en timtim_events`.

## 5-minute example

Place the block in the Content region with Location `Miami,US` and Event type Music. Visit the page: sample events show straight away. Put your website key in the block settings for real events and click counts.

## Settings

| Block setting | Meaning |
|---|---|
| Location | `City` or `City,CC` |
| Event type | Any, Music, Festival, Nightlife, Conference |
| How many | 1–24 |
| Layout | Cards, List, Compact |
| Colors | Light, Dark, Match visitor |
| Button color | Color picker |
| Show pictures / Show prices | On or off |
| TimTim.Live website key | Optional. The form refuses a server key (`tt_sk_live_…`) |

The block renders one `<timtim-events>` element (Drupal escapes every attribute) and attaches the hosted embed as an external library (`timtim_events/embed` → `https://timtim.live/embed/v1/timtim-events.js`). Drupal fetches and stores no event data and needs no secret.

## Screenshot / demo

Screenshot the block's configuration form and the page with the block placed.

## Troubleshooting

- **Block shows nothing** — check the browser console; a strict Content-Security-Policy must allow `https://timtim.live` (script) and `https://api.timtim.live` (connect).
- **"That is a server key"** — use your website key (`tt_pk_live_…`).
- **Website key shows nothing** — add your domain to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Drupal 10 and 11, PHP 8.1+.

## Test plan

CI lints every PHP file (`php -l`) and runs `php platforms/drupal/test/block_test.php`: defaults, every setting, a website/test key written and a server key never, unknown values dropped, and the library pointing at the hosted embed. Before drupal.org: install on a Drupal 10 and an 11 site and place the block.
