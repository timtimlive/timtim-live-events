#!/usr/bin/env node
/*
 * Generates src/generated/openapi.ts from openapi.yaml (this package's copy of
 * the TimTim.Live API contract) with openapi-typescript.
 *
 *   node scripts/generate-types.mjs           write the file
 *   node scripts/generate-types.mjs --check   exit 1 if the committed file is stale
 *
 * Never edit src/generated/openapi.ts by hand. To change a type, the contract
 * changes upstream, tools/sync-contract.mjs copies it here, and this runs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const contract = join(pkg, "openapi.yaml");
const out = join(pkg, "src", "generated", "openapi.ts");

const HEADER = `/*
 * GENERATED from openapi.yaml by scripts/generate-types.mjs (openapi-typescript).
 * Do not edit by hand: run \`npm run generate\`. CI fails if this file is stale.
 */
/* eslint-disable */
`;

const normalise = (s) => s.replace(/\r\n/g, "\n");

async function generate() {
  const ast = await openapiTS(pathToFileURL(contract), { alphabetize: false });
  return normalise(HEADER + astToString(ast));
}

const check = process.argv.includes("--check");
const fresh = await generate();
if (check) {
  const current = existsSync(out) ? normalise(readFileSync(out, "utf8")) : "";
  if (current !== fresh) {
    console.error("src/generated/openapi.ts is stale or missing. Run: npm run generate");
    process.exit(1);
  }
  console.log("src/generated/openapi.ts matches openapi.yaml.");
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, fresh);
  console.log(`wrote ${out}`);
}
