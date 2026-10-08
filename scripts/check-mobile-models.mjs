#!/usr/bin/env node
/*
 * The Swift and Kotlin models must say exactly what the contract says.
 *
 * For every object below, the field names in mobile/ios (Swift, camelCase,
 * decoded with .convertFromSnakeCase) and mobile/android (Kotlin, @SerialName
 * or the property name) must equal the property names in
 * packages/events-js/openapi.yaml. A field added to the contract and not to a
 * model — or the reverse — fails CI here, before an app silently drops it.
 *
 * It also checks that the test fixtures both platforms decode carry every
 * field the contract REQUIRES on an Event.
 *
 *   node scripts/check-mobile-models.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");
const spec = yaml.load(read("packages/events-js/openapi.yaml"));
const S = spec.components.schemas;
const ev = S.Event.properties;

/* contract object → [Swift struct, Kotlin class] */
const PAIRS = [
  ["Event", Object.keys(ev), "Event", "Event"],
  ["Event.location", Object.keys(ev.location.properties), "Location", "Location"],
  ["Event.performers[]", Object.keys(ev.performers.items.properties), "Performer", "Performer"],
  ["Event.tickets", Object.keys(ev.tickets.properties), "Tickets", "Tickets"],
  ["Event.earn", Object.keys(ev.earn.properties), "Earn", "Earn"],
  ["Event.display", Object.keys(ev.display.properties), "Display", "Display"],
  ["Event.organizer", Object.keys(ev.organizer.properties), "Organizer", "Organizer"],
  ["Category", Object.keys(S.Category.properties), "Category", "Category"],
  ["Location (a city)", Object.keys(S.Location.properties), "Place", "Place"],
  ["Problem", Object.keys(S.Problem.properties), "Problem", "Problem"],
];

const snake = (camel) => camel.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** The text between the brace after `struct Name` and its matching close (nested structs removed). */
function swiftFields(src, name) {
  const start = src.search(new RegExp(`struct ${name}\\b[^{]*\\{`));
  assert.ok(start >= 0, `Swift: struct ${name} not found`);
  let i = src.indexOf("{", start) + 1, depth = 1, body = "";
  for (; depth > 0 && i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    if (depth === 1 && c !== "}") body += c;
    else if (depth === 1 && c === "}") body += "\n";
  }
  return [...body.matchAll(/^\s*public let (\w+):/gm)].map((m) => snake(m[1]));
}

/** The constructor parameters of `data class Name(...)`. */
function kotlinFields(src, name) {
  const start = src.search(new RegExp(`data class ${name}\\(`));
  assert.ok(start >= 0, `Kotlin: data class ${name} not found`);
  let i = src.indexOf("(", start) + 1, depth = 1, body = "";
  for (; depth > 0 && i < src.length; i++) {
    const c = src[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (depth >= 1) body += c;
  }
  return [...body.matchAll(/(?:@SerialName\("([^"]+)"\)\s*)?val (\w+):/g)].map((m) => m[1] ?? m[2]);
}

const swift = read("mobile/ios/Sources/TimTimEvents/Models.swift");
const kotlin = read("mobile/android/src/main/kotlin/live/timtim/events/Models.kt");
const sorted = (a) => [...a].sort();
let checked = 0;
for (const [label, contract, swiftName, kotlinName] of PAIRS) {
  assert.deepEqual(sorted(swiftFields(swift, swiftName)), sorted(contract), `Swift ${swiftName} = contract ${label}`);
  assert.deepEqual(sorted(kotlinFields(kotlin, kotlinName)), sorted(contract), `Kotlin ${kotlinName} = contract ${label}`);
  checked++;
}

const required = S.Event.required;
for (const dir of ["mobile/ios/Tests/TimTimEventsTests/Fixtures", "mobile/android/src/test/resources/fixtures"]) {
  for (const file of ["city-miami-category-music.200.json", "simulate-cancelled.200.json"]) {
    const body = JSON.parse(read(`${dir}/${file}`));
    for (const event of body.events) for (const field of required) assert.ok(field in event, `${dir}/${file}: event has required field ${field}`);
  }
  assert.equal(read(`${dir}/simulate-rate_limited.429.json`), read("mobile/ios/Tests/TimTimEventsTests/Fixtures/simulate-rate_limited.429.json"), "both platforms test the same fixtures");
}

console.log(`check-mobile-models: ${checked} objects match the contract on Swift and Kotlin; fixtures carry every required Event field.`);
