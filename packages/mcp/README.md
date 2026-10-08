# @timtim-live/mcp

> **Developer Preview.** Not published to npm yet. **The zero-install way works today:** TimTim.Live hosts the same tools at
>
> ```text
> https://api.timtim.live/v1/mcp
> ```
>
> Paste that into your assistant's connector settings. Step-by-step for Claude, Claude Code, Cursor and VS Code: https://timtim.live/developers/ai

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server that lets an AI assistant find live events from TimTim.Live. It runs on your machine and talks to the public TimTim.Live API through [`@timtim-live/events`](../events-js).

## Tools

| Tool | What it does |
|---|---|
| `find_events` | Events by city, country, category, dates or performer |
| `find_events_near_location` | Events near a latitude/longitude, within a radius (km) |
| `find_events_by_category` | Events of one type, optionally in one city or country |
| `get_event` | One event by id — even when cancelled or ended |
| `list_categories` | Which event types have upcoming events |
| `list_locations` | Which cities have upcoming events |

Every answer keeps the event's **id**, **status**, **TimTim.Live page** and **ticket link** (`tickets.buy_url` — pass it on exactly as it is; it carries your partner credit).

It can only read. There is no tool that buys, refunds, changes an event or touches an account.

## Run it locally

Once on npm:

```bash
npx @timtim-live/mcp
```

From this repository today:

```bash
npm ci && npm run build
node packages/mcp/dist/cli.js
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "timtim-live": {
      "command": "node",
      "args": ["/path/to/timtim-live-events/packages/mcp/dist/cli.js"],
      "env": { "TIMTIM_API_KEY": "tt_test_..." }
    }
  }
}
```

| Setting | Meaning |
|---|---|
| `TIMTIM_API_KEY` | Your key. Leave it out for **sample events** (every answer then starts with "SAMPLE DATA"). Get a free test key at https://timtim.live/partners/dashboard |
| `TIMTIM_API_BASE_URL` | Another API address, for testing. Default `https://api.timtim.live/v1` |

Because this runs on your own machine, a server key (`tt_sk_live_…`) is fine here. Never put one in a web page.

## Use it in your own code

```ts
import { createServer } from "@timtim-live/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createServer({ apiKey: process.env.TIMTIM_API_KEY });
await server.connect(new StdioServerTransport());
```

## Troubleshooting

- **"SAMPLE DATA" in every answer** — no key is set. Set `TIMTIM_API_KEY`.
- **"We do not recognise that key"** — copy the whole key again from your dashboard.
- **"Too many requests"** — wait the number of seconds it says, then ask again.
- **Nothing on stdout but MCP** — notes go to stderr on purpose; stdout is the protocol.

## Test plan

`npm test` runs the server against a fake API through an in-memory MCP client: the six tools and their read-only marks, keyless vs keyed paths, argument checks (no request is made for a bad one), API problems turned into readable errors, and that id, status, page and ticket link survive into every answer.

## License

MIT. See [LICENSE](./LICENSE). The licence covers this client code only; it grants no rights to TimTim.Live event data, services, marks or trademarks.
