import { TimTimError } from "./errors.js";

/** How old a signature may be before it is refused (replay protection). Matches TimTim.Live's own rule. */
export const DEFAULT_TOLERANCE_S = 300;

export interface VerifyWebhookOptions {
  /** Your endpoint's signing secret (from https://timtim.live/partners/dashboard). */
  secret: string;
  /** The `TimTim-Signature` header exactly as received: `t=<unix seconds>,v1=<hex>`. */
  header: string | null | undefined;
  /**
   * The RAW request body, exactly as received — before any JSON parsing.
   * Re-serialising parsed JSON changes the bytes and the signature will not match.
   */
  body: string | Uint8Array | ArrayBuffer;
  /** Refuse signatures older (or newer) than this many seconds. Default 300. */
  toleranceS?: number;
  /** "Now" in unix seconds. Only for tests; leave it out in real code. */
  now?: number;
}

/** Splits `t=1700000000,v1=abc…` into its parts. Unknown parts are ignored. */
export function parseSignatureHeader(header: string): { t: number | null; v1: string[] } {
  let t: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=", 2);
    if (key === "t" && value !== undefined && /^\d+$/.test(value)) t = Number(value);
    if (key === "v1" && value) v1.push(value);
  }
  return { t, v1 };
}

/** Compares two strings in time that depends only on their length, not on where they differ. */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Subtle = {
  importKey(format: "raw", key: Uint8Array, algorithm: { name: "HMAC"; hash: "SHA-256" }, extractable: false, usages: ["sign"]): Promise<unknown>;
  sign(algorithm: "HMAC", key: unknown, data: Uint8Array): Promise<ArrayBuffer>;
};

async function subtleCrypto(): Promise<Subtle> {
  const fromGlobal = (globalThis as { crypto?: { subtle?: unknown } }).crypto?.subtle;
  if (fromGlobal) return fromGlobal as Subtle;
  /* Node 18 has Web Crypto but not on globalThis. The specifier is a variable so bundlers for browsers leave it alone. */
  const specifier = "node:crypto";
  const mod = (await import(/* @vite-ignore */ /* webpackIgnore: true */ specifier)) as { webcrypto?: { subtle?: unknown } };
  if (mod.webcrypto?.subtle) return mod.webcrypto.subtle as Subtle;
  throw new TimTimError("crypto_unavailable", "Web Crypto (crypto.subtle) is not available in this runtime.");
}

function bodyBytes(body: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  throw new TimTimError("invalid_argument", "verifyWebhook: body must be the raw request body (string, Uint8Array or ArrayBuffer).");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** HMAC-SHA256(secret, `${t}.${body}`) as lowercase hex — what TimTim.Live puts in v1. */
export async function computeSignature(secret: string, timestampS: number, body: string | Uint8Array | ArrayBuffer): Promise<string> {
  const subtle = await subtleCrypto();
  const encoder = new TextEncoder();
  const key = await subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prefix = encoder.encode(`${timestampS}.`);
  const raw = bodyBytes(body);
  const signed = new Uint8Array(prefix.length + raw.length);
  signed.set(prefix, 0);
  signed.set(raw, prefix.length);
  return toHex(await subtle.sign("HMAC", key, signed));
}

/**
 * Checks that a webhook really came from TimTim.Live and is fresh.
 *
 *   const ok = await verifyWebhook({ secret, header: req.headers["timtim-signature"], body: rawBody });
 *   if (!ok) return res.status(400).end();
 *
 * Resolves true only when the timestamp is within `toleranceS` of now AND a v1
 * signature matches (compared in constant time). Works in Node 18+, browsers,
 * Deno, Bun and edge runtimes (Web Crypto). After it passes, use the
 * `TimTim-Delivery-Id` header to ignore deliveries you already handled.
 */
export async function verifyWebhook(options: VerifyWebhookOptions): Promise<boolean> {
  const { secret, header, body } = options;
  if (typeof secret !== "string" || secret === "") {
    throw new TimTimError("invalid_argument", "verifyWebhook: secret is required (your endpoint's signing secret).");
  }
  if (typeof header !== "string" || header === "") return false;
  const { t, v1 } = parseSignatureHeader(header);
  if (t === null || v1.length === 0) return false;
  const tolerance = options.toleranceS ?? DEFAULT_TOLERANCE_S;
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - t) > tolerance) return false;
  const expected = await computeSignature(secret, t, body);
  let match = false;
  for (const candidate of v1) if (timingSafeEqualString(expected, candidate)) match = true;
  return match;
}
