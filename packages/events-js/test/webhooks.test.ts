import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { computeSignature, parseSignatureHeader, timingSafeEqualString, verifyWebhook } from "../src/index.js";

const SECRET = "example-endpoint-secret";
const BODY = JSON.stringify({ id: "whd_test_1", type: "event.changed", created_at: "2026-10-06T15:04:05.000Z", mode: "test", data: { event: { id: "evt_test_miami_konpa", status: "cancelled" } } });

/* "now" is passed explicitly wherever a test sits near the 300-second edge, so a slow run cannot flip it. */
/** Signs exactly the way TimTim.Live's server does: HMAC-SHA256(secret, `${t}.${body}`) as hex. */
function sign(secret: string, t: number, body: string): string {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}

const now = Math.floor(Date.now() / 1000);

describe("verifyWebhook", () => {
  it("accepts a correctly signed, fresh delivery", async () => {
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now, BODY), body: BODY })).toBe(true);
  });

  it("matches a known-answer vector computed the way the server signs", async () => {
    /* HMAC-SHA256("example-endpoint-secret", "1700000000." + body) — fixed bytes, fixed answer. */
    const body = '{"id":"whd_example","type":"event.changed"}';
    const expected = "85a5c34573f2bbcfc43ec2a6b3c0e81e2f7afb9ebc3434270231999c8c86461a";
    expect(createHmac("sha256", SECRET).update(`1700000000.${body}`).digest("hex")).toBe(expected);
    expect(await computeSignature(SECRET, 1700000000, body)).toBe(expected);
    expect(await verifyWebhook({ secret: SECRET, header: `t=1700000000,v1=${expected}`, body, now: 1700000000 })).toBe(true);
    expect(await verifyWebhook({ secret: SECRET, header: `t=1700000000,v1=${expected}`, body, now: 1700000000 + 299 })).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const header = sign(SECRET, now, BODY);
    const tampered = BODY.replace("cancelled", "scheduled");
    expect(await verifyWebhook({ secret: SECRET, header, body: tampered })).toBe(false);
    expect(await verifyWebhook({ secret: SECRET, header, body: BODY + " " })).toBe(false);
  });

  it("rejects a signature made with another secret", async () => {
    expect(await verifyWebhook({ secret: SECRET, header: sign("some-other-secret", now, BODY), body: BODY })).toBe(false);
  });

  it("rejects a stale or future timestamp (more than 300 s away)", async () => {
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now - 301, BODY), body: BODY, now })).toBe(false);
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now + 301, BODY), body: BODY, now })).toBe(false);
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now - 299, BODY), body: BODY, now })).toBe(true);
  });

  it("honours a custom tolerance", async () => {
    const header = sign(SECRET, now - 100, BODY);
    expect(await verifyWebhook({ secret: SECRET, header, body: BODY, toleranceS: 60, now })).toBe(false);
    expect(await verifyWebhook({ secret: SECRET, header, body: BODY, toleranceS: 120, now })).toBe(true);
  });

  it("rejects a replay: a valid v1 with a new timestamp written over it", async () => {
    const old = sign(SECRET, now - 1000, BODY);
    const v1 = old.split("v1=")[1];
    expect(await verifyWebhook({ secret: SECRET, header: `t=${now},v1=${v1}`, body: BODY })).toBe(false);
  });

  it.each([
    ["empty", ""],
    ["missing", undefined],
    ["null", null],
    ["garbage", "garbage"],
    ["no v1", `t=${now}`],
    ["no t", "v1=abcdef"],
    ["t not a number", "t=abc,v1=abcdef"],
    ["empty v1", `t=${now},v1=`],
    ["wrong length v1", `t=${now},v1=abc`],
  ])("rejects a malformed header (%s)", async (_name, header) => {
    expect(await verifyWebhook({ secret: SECRET, header: header as string, body: BODY })).toBe(false);
  });

  it("accepts the raw body as bytes", async () => {
    const bytes = new TextEncoder().encode(BODY);
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now, BODY), body: bytes })).toBe(true);
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now, BODY), body: bytes.buffer as ArrayBuffer })).toBe(true);
  });

  it("handles non-ASCII bodies byte for byte", async () => {
    const body = JSON.stringify({ name: "TEST EVENT — NO REAL MONEY · Fête à Montréal 🎶" });
    expect(await verifyWebhook({ secret: SECRET, header: sign(SECRET, now, body), body })).toBe(true);
  });

  it("accepts the header with spaces after commas, and any matching v1", async () => {
    const good = sign(SECRET, now, BODY).split("v1=")[1];
    expect(await verifyWebhook({ secret: SECRET, header: `t=${now}, v1=${"0".repeat(64)}, v1=${good}`, body: BODY })).toBe(true);
  });

  it("throws when the secret is missing (a setup mistake, not a bad delivery)", async () => {
    await expect(verifyWebhook({ secret: "", header: sign(SECRET, now, BODY), body: BODY })).rejects.toMatchObject({ code: "invalid_argument" });
  });
});

describe("helpers", () => {
  it("parseSignatureHeader", () => {
    expect(parseSignatureHeader("t=1700000000,v1=abc")).toEqual({ t: 1700000000, v1: ["abc"] });
    expect(parseSignatureHeader("v1=abc")).toEqual({ t: null, v1: ["abc"] });
  });

  it("timingSafeEqualString", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("abc", "abcd")).toBe(false);
    expect(timingSafeEqualString("", "")).toBe(true);
  });
});
