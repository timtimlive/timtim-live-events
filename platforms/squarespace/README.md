# TimTim.Live Events for Squarespace

**Works today** with a Code Block. Squarespace has no app store for this, so the Code Block is the supported way.

## Install

1. Make your code at https://timtim.live/developers/widget.
2. Edit the page → **Add Block → Code**.
3. Paste the code, leave the mode as **HTML** → **Save**.

## 5-minute example

```html
<script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>
<timtim-events location="Washington,US" category="music" limit="6"></timtim-events>
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

Screenshot the Code Block editor and the saved page.

## Troubleshooting

- **"Script disabled" in the editor** — normal; save and view the live page.
- **No Code Block option** — your plan does not allow code blocks; Squarespace's plan page says which do.
- **Website key shows nothing** — add your Squarespace domains to the key's allowed websites at https://timtim.live/partners/dashboard.

## Compatibility

Squarespace 7.0 and 7.1 sites on plans with Code Blocks.

## Test plan

The embed itself is tested in `packages/web-component`. Manually: add a Code Block to a test page, save, view the live page, check events and the "Get tickets" link.
