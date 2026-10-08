# Marketplace checklist

Where each integration stands, and what is still needed to list it. Nothing here is listed in a marketplace yet; **nothing is called production-ready until its marketplace has approved it.**

Common to every listing:

| Item | Value |
|---|---|
| Privacy policy | https://timtim.live/privacy |
| Terms | https://timtim.live/partners/terms (API) · https://timtim.live/terms (site) |
| Support | https://timtim.live/help · bookings@timtim.live |
| Developer docs | https://timtim.live/developers/connect |
| Test credentials for reviewers | No key needed: every integration shows **sample events** without one. If a reviewer needs a key, make a **test key** (`tt_test_…`) at https://timtim.live/partners/dashboard — never a live or server key |
| Permissions | **None.** Every integration only loads the public embed; none reads store, site or user data |
| Data collected | None by the integration. The embed sends anonymous view/click counts to TimTim.Live (no cookie, no IP stored) |
| Listing assets | Icon (TimTim.Live mark), 3–5 screenshots of the settings panel and the events on a page, a 30-second screen recording, short and long description |

## Per marketplace

| Marketplace | What exists | Account needed (TimTim.Live) | Review | Then |
|---|---|---|---|---|
| **WordPress** | Plugin, in its own repository (`timtim-wordpress`), downloadable from timtim.live | WordPress.org account to submit to the plugin directory | Plugin team review (security, GPL-compatible licence, no remote code beyond the documented embed) | SVN commit for each version |
| **Shopify App Store** | Theme app block in `shopify/` (`shopify app deploy` ready) | Shopify Partner account; create the app; `shopify app config link` fills `client_id` | App review (performance, theme-editor use, listing) | `shopify app deploy` → submit |
| **Wix App Market** | Working Custom Element / Embed HTML paths (`wix/`). The app itself is **not built** | Wix Developers account | App review | Build a site widget app with the Wix CLI on the same embed |
| **Webflow Marketplace** | Working Code Embed path (`webflow/`). The app/component is **not built** | Webflow developer workspace | Marketplace review | Build a component on the same embed |
| **Framer Marketplace** | Code component in `framer/` (works today by paste) | Framer creator account | Marketplace review | Publish the component |
| **Bubble plugin store** | Plugin element code in `bubble/plugin-element/` | Bubble account | Plugin review | Build in Bubble's plugin editor (steps in `bubble/README.md`) and submit |
| **Drupal.org** | Module in `drupal/timtim_events` | Drupal.org account with Git access | Project application (security advisory coverage) | Create project, tag releases |
| **Joomla Extensions Directory** | Module in `joomla/mod_timtim_events` | JED account | JED listing review | Upload zip + listing |
| **npm** | `@timtim-live/events`, `web-component`, `react`, `react-native`, `mcp` | `@timtim-live` npm scope with Trusted Publishing | — | `release.yml` publishes with provenance |
| **Swift Package Index / Maven Central** | `mobile/ios`, `mobile/android` | A repository with `Package.swift` at its root (SwiftPM); a Sonatype namespace for `live.timtim` (Maven) | — | Publish |
| **GitHub Releases** | All of the above | Already set up | — | Tag a release |

## Before any submission

1. Install on a fresh test site/store/app of that platform and follow the README's **Install** section word for word.
2. Check: events show with no key; a test key shows the sample + counts on the dashboard; a server key is refused or ignored.
3. Screenshot the settings panel and the page.
4. Never request more platform permissions than listed above (none).
