# Contributing to the TimTim.Live Event SDK

Thank you! This is a **Developer Preview**, so telling us what confused you is as valuable as code.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md). Security problems go **privately** through "Report a vulnerability" on the Security tab ([SECURITY.md](SECURITY.md)).

## Set up

You need Node 20.19 or newer and npm.

```bash
npm ci
npm run build
npm test
```

## The checks CI runs

```bash
npm run lint              # ESLint (flat config)
npm run typecheck         # TypeScript, every package
npm run build             # tsup: ESM + CJS + .d.ts, and the web component's single-file bundle
npm test                  # unit tests (vitest), no network
npm run check:generated   # src/generated/openapi.ts matches openapi.yaml
npm run test:integration  # the real keyless demo endpoint, validated against the contract
npm run smoke:dist        # the built SDK on the oldest supported Node (CI runs it on Node 18)
```

## Rules

1. **Only the contract.** Methods, parameters and types must match [`packages/events-js/openapi.yaml`](packages/events-js/openapi.yaml). That file is a copy published from TimTim.Live's source of truth — do not edit it. API change requests go to [timtim-openapi issues](https://github.com/timtimlive/timtim-openapi/issues).
2. **Types are generated.** Never edit `packages/events-js/src/generated/openapi.ts`; run `npm run generate`.
3. **No duplicate API logic.** The web component and React packages call `@timtim-live/events`; they never call `fetch` themselves.
4. **Safe rendering.** `textContent` only (ESLint blocks `innerHTML`), `https:` links and images only, server keys refused in browsers.
5. **Tests that can fail.** When you add an assertion, break the code it checks once and watch the test fail.
6. **Simple words** in READMEs and error messages.
7. **No secrets**, ever. Placeholders like `tt_test_YOUR_KEY` only.

## Pull requests

Fill in the template. A maintainer reviews every pull request (see [GOVERNANCE.md](GOVERNANCE.md) and [MAINTAINERS.md](MAINTAINERS.md)). Add a line to [CHANGELOG.md](CHANGELOG.md) under "Unreleased" if people will notice your change.

By contributing you agree your work is licensed under the [MIT License](LICENSE).
