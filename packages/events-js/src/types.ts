/*
 * Friendly names for the types generated from the API contract
 * (src/generated/openapi.ts, made from openapi.yaml). Nothing here is written
 * by hand except the names: every shape comes from the contract.
 */
import type { components, operations } from "./generated/openapi.js";

type JsonOf<T> = T extends { content: { "application/json": infer B } } ? B : never;

/* Objects */
export type Event = components["schemas"]["Event"];
export type Withdrawn = components["schemas"]["Withdrawn"];
export type Earning = components["schemas"]["Earning"];
export type TicketType = components["schemas"]["TicketType"];
export type Order = components["schemas"]["Order"];
export type Settlement = components["schemas"]["Settlement"];
export type Offer = components["schemas"]["Offer"];
export type Problem = components["schemas"]["Problem"];

/* Responses */
export type EventList = JsonOf<operations["listEvents"]["responses"][200]>;
export type DemoEventList = JsonOf<operations["listDemoEvents"]["responses"][200]>;
export type EventResponse = JsonOf<operations["getEvent"]["responses"][200]>;
export type TicketTypeList = JsonOf<operations["listTicketTypes"]["responses"][200]>;
export type EarningList = JsonOf<operations["listEarnings"]["responses"][200]>;
export type SettlementList = JsonOf<operations["listSettlements"]["responses"][200]>;
export type OfferList = JsonOf<operations["listOffers"]["responses"][200]>;

/* Requests */
export type ListEventsParams = NonNullable<operations["listEvents"]["parameters"]["query"]>;
export type ListDemoEventsParams = NonNullable<operations["listDemoEvents"]["parameters"]["query"]>;
export type ListOffersParams = NonNullable<operations["listOffers"]["parameters"]["query"]>;
export type CreateOrderBody = operations["createOrder"]["requestBody"]["content"]["application/json"];
export type FeedFile = operations["eventFeed"]["parameters"]["path"]["file"];
export type FeedParams = Omit<NonNullable<operations["eventFeed"]["parameters"]["query"]>, "key">;
export type Simulation = NonNullable<ListDemoEventsParams["simulate"]>;

/* Webhook messages (what TimTim.Live POSTs to your endpoint) */
export type EventChangedMessage = JsonOf<NonNullable<operations["eventChangedWebhook"]["requestBody"]>>;
export type EarningsChangedMessage = JsonOf<NonNullable<operations["earningsChangedWebhook"]["requestBody"]>>;
export type WebhookMessage = EventChangedMessage | EarningsChangedMessage;

export type { components, operations, paths, webhooks } from "./generated/openapi.js";
