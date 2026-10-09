/**
 * @timtim-live/events — the TimTim.Live Event SDK (Developer Preview).
 *
 * Docs: https://timtim.live/developers/docs
 * Contract: https://timtim.live/partner-api/openapi.yaml
 */
export { TimTimEvents, DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS, SDK_VERSION, retryDelayMs, toQueryString } from "./client.js";
export type { TimTimEventsOptions, FeedFormat } from "./client.js";
export { TimTimError, TimTimApiError, parseRetryAfter } from "./errors.js";
export { verifyWebhook, computeSignature, parseSignatureHeader, timingSafeEqualString, DEFAULT_TOLERANCE_S } from "./webhooks.js";
export type { VerifyWebhookOptions } from "./webhooks.js";
export type * from "./types.js";
