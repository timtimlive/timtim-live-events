#!/usr/bin/env node
/*
 * Runtime check of the BUILT packages, with no test framework and no network,
 * so it can run on the oldest Node the packages promise (18). The dev
 * toolchain (vitest, eslint, vite) needs Node 20.19+, so CI builds on a newer
 * Node and then runs only this file on Node 18.
 *
 *   npm run build && node scripts/smoke-dist.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);

const esm = await import("../packages/events-js/dist/index.js");
const cjs = require("../packages/events-js/dist/index.cjs");

for (const [name, sdk] of [["esm", esm], ["cjs", cjs]]) {
  /* Webhook known-answer vector — on Node 18 this exercises the node:crypto webcrypto fallback. */
  const body = '{"id":"whd_example","type":"event.changed"}';
  const v1 = "85a5c34573f2bbcfc43ec2a6b3c0e81e2f7afb9ebc3434270231999c8c86461a";
  assert.equal(await sdk.computeSignature("example-endpoint-secret", 1700000000, body), v1, `${name}: computeSignature`);
  assert.equal(await sdk.verifyWebhook({ secret: "example-endpoint-secret", header: `t=1700000000,v1=${v1}`, body, now: 1700000000 }), true, `${name}: verifyWebhook`);
  assert.equal(await sdk.verifyWebhook({ secret: "example-endpoint-secret", header: `t=1700000000,v1=${v1}`, body: body + " ", now: 1700000000 }), false, `${name}: tampered`);

  const seen = [];
  const fakeFetch = async (url) => {
    seen.push(String(url));
    return new Response(JSON.stringify({ object: "list", mode: "test", events: [], next: null }), { headers: { "Content-Type": "application/json" } });
  };
  const tt = new sdk.TimTimEvents({ fetch: fakeFetch });
  const page = await tt.events.list({ city: "Miami", category: "music" });
  assert.equal(page.object, "list", `${name}: list`);
  assert.equal(seen[0], "https://api.timtim.live/v1/demo/events?city=Miami&category=music", `${name}: demo url`);
  await assert.rejects(tt.events.get("x"), (e) => e.code === "key_required", `${name}: key_required`);
  console.log(`ok ${name} build on Node ${process.versions.node}`);
}

for (const file of ["packages/web-component/dist/timtim-events.global.js", "packages/web-component/dist/index.js", "packages/react/dist/index.js", "packages/react/dist/index.cjs"]) {
  assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `missing ${file} — run npm run build`);
}
console.log("ok all build outputs present");
