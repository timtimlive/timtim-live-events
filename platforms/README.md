# Platform integrations

One embed, many platforms. Every integration here loads the same hosted, open-source `<timtim-events>` (`https://timtim.live/embed/v1/timtim-events.js`). None fetches events itself, none needs a secret, and none asks for platform permissions.

| Platform | Works today | Marketplace listing |
|---|---|---|
| [Shopify](./shopify) | Custom Liquid section | App block built; needs Partner account + review |
| [Wix](./wix) | Custom Element or Embed HTML | Not built; needs Wix developer account |
| [Webflow](./webflow) | Code Embed | Not built; needs Webflow workspace |
| [Squarespace](./squarespace) | Code Block | — (no app store for this) |
| [Framer](./framer) | Code component (paste) | Needs Framer creator account |
| [Drupal](./drupal) | Module (install from this repo) | Needs drupal.org project |
| [Joomla](./joomla) | Module (install from this repo) | Needs JED listing |
| [Bubble](./bubble) | HTML element | Plugin code ready; needs Bubble account |
| WordPress | Plugin — see the `timtim-wordpress` repository | Needs WordPress.org submission |

Make the code for any of them at https://timtim.live/developers/widget, or find your platform at https://timtim.live/developers/connect.

What each listing still needs: [MARKETPLACES.md](./MARKETPLACES.md).

Tests: `npm test` renders the Shopify block with Liquid, the Framer component and the Bubble element. It checks every README and file for the hosted embed and no server key. The PHP job in CI checks the Drupal and Joomla rules with `php -l`.
