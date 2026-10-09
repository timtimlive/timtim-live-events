# @timtim-live/react-native

> **Developer Preview.** Not published to npm yet.

Live events from TimTim.Live in an iOS or Android app built with React Native or Expo. Built on [`@timtim-live/react`](../react) and [`@timtim-live/events`](../events-js), so the app shows the same events, ids and ticket links as every website.

## Use

```tsx
import { TimTimEventList } from "@timtim-live/react-native";

export default function Events() {
  return <TimTimEventList location="Miami,US" category="music" />;
}
```

No key = sample events (each says "Sample — no real money"). Add your website key for real ones: `apiKey="tt_pk_live_…"`.

Your own design? Use the hook:

```tsx
import { useTimTimEvents } from "@timtim-live/react-native";

const { events, loading, error, refetch } = useTimTimEvents({ city: "Paris", category: "festival" });
```

## Props

| Prop | Meaning |
|---|---|
| `city`, `country`, `category`, `from`, `to`, `artist`, `limit` | Filters, as in the API (default 10 events) |
| `location` | `"City"` or `"City,CC"` |
| `apiKey` | Website key or test key. **Never a server key** — it is refused |
| `labels` | Your words (English by default) |
| `locale` | Language for prices |
| `color` | Button color |
| `tracking` | `false` sends nothing. Otherwise views and taps are counted for your dashboard — never money |
| `onPressTickets(event, url)` | Handle the tap yourself (still open `url` as given) |
| `renderEvent(event)` | Draw each event yourself |

Ticket links open with `Linking.openURL`, exactly as given — that is how your partner credit is kept. Cancelled, sold-out and ended events show their status and no ticket button. Only `https` pictures and links are used.

## Troubleshooting

- **"We could not load events right now."** — check the key; a server key is refused in apps.
- **No pictures** — only `https` images are shown.

## Test plan

`npm test` renders the list against a fake API, with plain host elements in place of React Native components. It checks the sample badge, price, named ticket button and ticket link. It checks that impressions and taps are counted and cancelled events get no button. It checks that a server key is refused and http links are dropped. `npm run typecheck` checks against the real React Native types.

## License

MIT. See [LICENSE](./LICENSE).
