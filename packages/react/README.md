# @timtim-live/react

> **Developer Preview.** Not published to npm yet — build it from [the repository](https://github.com/timtimlive/timtim-live-events) for now.

React components and a hook for TimTim.Live events. Every request goes through [`@timtim-live/events`](../events-js); this package only adds React state and markup. Needs React 18 or newer.

[Live Demo](https://timtim.live/developers/demo) · [Documentation](https://timtim.live/developers/docs) · [Sandbox](https://timtim.live/developers/sandbox) · [Developer Access](https://timtim.live/developers) · [Community](https://timtim.live/developers/community)

## Use

```jsx
import { TimTimProvider, TimTimEvents, useTimTimEvents } from "@timtim-live/react";

export function App() {
  return (
    <TimTimProvider /* apiKey="tt_test_YOUR_KEY" — no key = sample events */>
      <TimTimEvents city="Miami" category="music" limit={6} />
    </TimTimProvider>
  );
}

function MyOwnList() {
  const { events, loading, error, refetch } = useTimTimEvents({ city: "Paris" });
  if (loading) return <p>Loading…</p>;
  if (error) return <button onClick={refetch}>Try again</button>;
  return <ul>{events.map((e) => <li key={e.id}>{e.name}</li>)}</ul>;
}
```

- `<TimTimEvents>` takes every `events.list` filter plus `simulate`, `apiKey`, `baseUrl`, `enabled`, `labels`, `className` and `render={(result) => …}` to draw it yourself.
- The default markup is unstyled; class names start with `timtim-`.
- Links and images must be `https:`; React escapes all text.
- A server key (`tt_sk_live_…`) in the browser is refused: the hook returns it as `error` (`code: "secret_key_in_browser"`) and nothing is sent.
- The build starts with `"use client"`, so it works in the Next.js App Router.

## License

MIT © 2026 timtim-live
