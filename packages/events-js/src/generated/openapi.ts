/*
 * GENERATED from openapi.yaml by scripts/generate-types.mjs (openapi-typescript).
 * Do not edit by hand: run `npm run generate`. CI fails if this file is stale.
 */
/* eslint-disable */
export interface paths {
    "/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Find events
         * @description Upcoming events you may show, oldest first. With `changed_since`, every event that changed after that time, including ones that ended or were cancelled.
         */
        get: operations["listEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/demo/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sample events, no key
         * @description The same answer as `GET /events` for a test key — sample events only,
         *     every name starting "TEST EVENT — NO REAL MONEY" — with no key and no
         *     sign-up. Readable from any website (CORS `*`). This is what
         *     https://timtim.live/developers/demo and the widget with no `data-key` call.
         *
         *     `simulate` (sandbox only) shows how your code should behave on a bad day:
         *     `sold_out`, `cancelled`, `rescheduled` and `postponed` change every sample
         *     event; `invalid_key` and `rate_limited` answer with the exact problem a real
         *     key would get (401, and 429 with `Retry-After`).
         */
        get: operations["listDemoEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * One event
         * @description Returned even after it ended or was cancelled, so you can take it down.
         */
        get: operations["getEvent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/earnings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Your results
         * @description Sales that came through your buy links and what they earned. Never a buyer's name, email, address, phone or card. Needs a server key (tt_sk_live_) or a test key.
         */
        get: operations["listEarnings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/bulk/{file}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * A custom bulk feed — every event a saved subscription covers, in one gzipped file
         * @description Save up to 5 subscriptions on /partners/dashboard (countries,
         *     categories, days ahead, reward-paying only). `file` is
         *     `<subscription id>.ndjson.gz` (one public Event per line — the same
         *     object /events returns) or `<subscription id>.csv.gz` (the feed's CSV
         *     columns). The file is made from the live events each time, through the
         *     same rights rule and your agreement; a subscription can only narrow
         *     what your agreement allows. Server keys only, as an Authorization
         *     header. A LIVE key needs the BULK_FEEDS capability; a test key gets the
         *     sample events. A full file at most every 15 minutes per subscription
         *     (429 with Retry-After otherwise). `changed_since` makes a changes-only
         *     file — not rate-limited beyond your key — and, in NDJSON, adds
         *     `{"object":"withdrawn","id":…,"withdrawn_at":…}` lines for events to
         *     take down. At most 250,000 events per file. A file that ends
         *     early is not valid gzip — retry rather than load it.
         */
        get: operations["bulkFeed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events/{id}/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Ticket types you may sell in your own app (embedded commerce)
         * @description The paid ticket types on sale for one event, with the all-in price to
         *     show (fees and tax included). Free tickets are not sold through orders —
         *     use the event's buy_url. Server keys only. A LIVE key needs the
         *     EMBEDDED_CHECKOUT capability (granted by TimTim.Live after review) and
         *     TimTim.Live card payments switched on; a test key always gets a sample.
         */
        get: operations["listTicketTypes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Hold tickets for your buyer and get TimTim.Live's payment link
         * @description Embedded commerce (§145): your app collects the choice and the buyer;
         *     TimTim.Live holds the tickets for about 30 minutes and returns
         *     `checkout_url` — TimTim.Live's payment page on the organizer's own
         *     account. Open it for the buyer (a new tab or an in-app browser). Card
         *     details never pass through the API. The sale is credited to your company
         *     directly — no click, no cookie, no postback — under the same rules and
         *     limits as a buy_url. Send an `Idempotency-Key`: the same key returns the
         *     same order, never a second hold. Server keys only; same access rules as
         *     /events/{id}/tickets.
         */
        post: operations["createOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The status of an order your company began
         * @description Status only — never the buyer's name or email. `checkout_url` is included only while the order is still awaiting payment.
         */
        get: operations["getOrder"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settlements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Your monthly statements (custom settlement)
         * @description For companies paid under agreed settlement terms. Once a calendar month
         *     (UTC) has closed, the money Ready for you goes on one statement, paid
         *     `net_days` after the month ends; under the agreed minimum it is carried
         *     to the next month. READ ONLY — how and where you are paid is agreed with
         *     TimTim.Live and can never be changed with a key. Needs a secret key or a
         *     test key (test keys see none). Each statement's lines are the same
         *     records /earnings gives.
         */
        get: operations["listSettlements"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/offers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Card-linked offers (banks and rewards programmes)
         * @description Events that pay a reward right now, shaped as offers a bank or rewards
         *     programme can show its customers: merchant, eligible dates, price,
         *     destination and the commercial rules. Same filters and paging as
         *     /events (commissioned=true is always applied).
         *
         *     Enterprise: a LIVE key needs the CARD_LINKED_OFFERS capability, granted
         *     by TimTim.Live after review. A test key always gets sample offers.
         *     Server keys only (tt_sk_live_ or a test key) — never a website key.
         *
         *     Activation is your tracked link (`activation.url`); rewards are paid to
         *     your partner account and reported by /earnings. Matching card
         *     transactions directly needs a card-network or bank agreement with
         *     TimTim.Live, which is not in place, so `matching.card_transactions` is
         *     false. Tickets are charged by each organizer's own payment account, so
         *     `merchant.statement_descriptor` is null rather than guessed.
         */
        get: operations["listOffers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/oauth/token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Get an access token (OAuth 2.0 client credentials)
         * @description Optional, for large integrations (RFC 6749 §4.4). Authenticate the OAuth
         *     client once — HTTP Basic or client_id/client_secret in the form — and get
         *     a one-hour bearer token to send instead of a key. Make OAuth clients on
         *     /partners/dashboard. The client secret is never accepted as a key.
         */
        post: operations["oauthToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/oauth/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** End an access token early (RFC 7009) */
        post: operations["oauthRevoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/feeds/{file}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The same events as a feed
         * @description events.json (JSON Feed 1.1), events.rss (RSS 2.0), events.xml or events.csv —
         *     the same events, filters and rights as GET /events. Feed readers cannot send
         *     headers, so a website key (tt_pk_live_) or test key may be given as ?key=.
         *     A server key is refused in a URL.
         */
        get: operations["eventFeed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface webhooks {
    "event.changed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * An event you may show changed (created, changed, cancelled, rescheduled, sold out, reopened) — or was withdrawn.
         * @description data carries EITHER `event` (show or update it) OR `withdrawn` (it is no longer shared with partners: stop showing that id and remove its buy_url). Signed with your endpoint secret — see TimTim-Signature. Answer 2xx within 10 seconds; otherwise we retry after 1 m, 5 m, 30 m, 2 h, 6 h, 12 h and 24 h.
         */
        post: operations["eventChangedWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "earnings.changed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** One of your earnings was created or changed state (pending, approved, ready, paid, reversed). */
        post: operations["earningsChangedWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "conversion.postback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Conversion postback (optional): we call YOUR URL template with the sale's values filled in.
         * @description Added on /partners/dashboard (Advanced). Rides earnings.changed, so a
         *     sale, an approval, a payout and a refund each call it once — {status}
         *     says which. Values: {sub_id} {sale_id} {event_id} {status} {commission}
         *     {transaction_value} {currency} {created_at} {delivery_id}, each
         *     URL-encoded. Values may only appear after the host. Unsigned: put your
         *     tracker's own token in the template. Same retries as webhooks; any 2xx
         *     is success. This is outbound only — TimTim.Live runs every checkout,
         *     so partners never report sales to us (§25).
         */
        get: operations["conversionPostback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface components {
    schemas: {
        /** @description An event that is no longer shared with partners. Stop showing it. Never says why. */
        Withdrawn: {
            id: string;
            /** Format: date-time */
            withdrawn_at: string;
        };
        Event: {
            /** @example evt_test_washington_konpa */
            id: string;
            name: string;
            /** @enum {string} */
            status: "scheduled" | "postponed" | "rescheduled" | "cancelled" | "sold_out" | "completed";
            /**
             * Format: date-time
             * @description Exact start, when the organizer gave one.
             */
            starts_at: string | null;
            /** Format: date-time */
            ends_at: string | null;
            /**
             * Format: date
             * @description The day as the venue calls it.
             */
            date: string;
            timezone: string | null;
            location: {
                venue?: string | null;
                address?: string | null;
                city?: string | null;
                country?: string | null;
                lat?: number | null;
                lng?: number | null;
            };
            /** Format: uri */
            image: string | null;
            category: string | null;
            performers: {
                name?: string;
            }[];
            tickets: {
                from?: number | null;
                to?: number | null;
                currency?: string | null;
                /** @enum {string} */
                availability?: "available" | "limited" | "sold_out" | "not_on_sale" | "ended";
                /**
                 * Format: uri
                 * @description Use this link exactly as given. It carries your attribution. Optional: add ?sub_id=YOUR_CLICK_ID (letters, digits, . _ ~ -, up to 100) and the sale carries it back as Earning.sub_id and in postbacks.
                 */
                buy_url?: string;
            };
            earn: {
                eligible: boolean;
                /** @description A fixed reward per eligible ticket. */
                amount?: number;
                /** @description A share of each eligible ticket. */
                percent?: number;
                currency?: string;
                /** @example $5 per eligible ticket */
                description?: string;
            };
            can_share: boolean;
            /**
             * Format: uri
             * @description The event's public page.
             */
            url: string;
            /** @description Ready-made words for your card. For display only, never for accounting. */
            display: {
                short_description?: string | null;
                /** @example Sat, Oct 10 · 7:00 PM */
                date_label?: string;
                /** @example From $45 */
                price_label?: string;
            };
            organizer: {
                name?: string | null;
                verified?: boolean;
            };
            /** @description True for sandbox events. */
            test: boolean;
            /** Format: date-time */
            updated_at: string;
            /** Format: date-time */
            inventory_updated_at: string | null;
        };
        Earning: {
            sale_id: string;
            event_id: string | null;
            transaction_value: number | null;
            /** @description Negative when a refund reversed it. */
            commission: number;
            currency: string;
            /** @enum {string} */
            status: "pending" | "approved" | "ready" | "paid" | "reversed";
            reason: string | null;
            /** Format: date-time */
            created_at: string;
            test: boolean;
            /** @description Your own click id, from ?sub_id= on the buy link that led to this sale. A refund carries the sale's sub_id. */
            sub_id: string | null;
        };
        TicketType: {
            id: string;
            name: string;
            /** @description The ticket's own price. */
            price: number;
            /** @description What the buyer pays for one ticket, fees and tax included — show this number. */
            total_per_ticket: number;
            currency: string;
            max_per_order: number;
            available: boolean;
            /** @enum {string} */
            sales: "open" | "not_yet" | "ended";
        };
        Order: {
            /** @constant */
            object: "order";
            id: string;
            event_id: string;
            quantity: number;
            /** @description What the buyer will pay, all included. */
            total: number | null;
            currency: string | null;
            /** @enum {string} */
            status: "awaiting_payment" | "paid" | "expired" | "cancelled" | "refunded" | "partially_refunded" | "test";
            sub_id: string | null;
            /**
             * Format: uri
             * @description Only while awaiting payment.
             */
            checkout_url?: string;
            /** Format: date-time */
            expires_at?: string;
            /** Format: date-time */
            created_at: string;
            test: boolean;
        };
        Settlement: {
            /** @example stl_po_abc_202610 */
            id: string;
            /** Format: date */
            period_start: string;
            /**
             * Format: date
             * @description Exclusive — the first day of the next month.
             */
            period_end: string;
            /** Format: date */
            due_on: string;
            /** @description Net of refunds. For a carried statement, the amount that moved to next month. */
            amount: number;
            currency: string;
            lines: number;
            /** @enum {string} */
            status: "carried" | "issued" | "paying" | "paid" | "failed" | "void";
            /** @enum {string} */
            method: "stripe_transfer" | "bank_transfer";
            /** @description The agreement's reference (contract or PO). */
            reference: string | null;
            /** @description The Stripe transfer id or bank wire reference, once paid. */
            payment_reference: string | null;
            /** Format: date-time */
            issued_at: string;
            /** Format: date-time */
            paid_at: string | null;
        };
        Offer: {
            /** @constant */
            object: "offer";
            /** @example ofr_evt_test_washington_konpa */
            id: string;
            event_id: string;
            title: string;
            merchant: {
                /** @description The organizer. */
                name?: string | null;
                /** @constant */
                merchant_of_record?: "organizer";
                /** @description Not held by TimTim.Live; each organizer's own payment account charges the card. */
                statement_descriptor?: null;
                verified?: boolean;
            };
            destination: {
                venue?: string | null;
                address?: string | null;
                city?: string | null;
                country?: string | null;
                lat?: number | null;
                lng?: number | null;
            };
            eligible: {
                /** Format: date */
                purchase_from?: string;
                /** Format: date */
                purchase_until?: string;
                /** Format: date */
                event_date?: string;
                /** Format: date-time */
                starts_at?: string | null;
            };
            price: {
                from?: number | null;
                to?: number | null;
                currency?: string | null;
            };
            reward: {
                /** @enum {string} */
                kind?: "flat" | "percent";
                amount?: number;
                percent?: number;
                currency?: string;
                description?: string;
                /** @constant */
                funded_by?: "organizer";
                /**
                 * @description Paid to your partner account; passing it to your customer is your own programme.
                 * @constant
                 */
                paid_to?: "partner";
            };
            limits: {
                /** @description Null = the organizer set no limit. */
                budget_remaining?: number | null;
                /** @description Fixed rewards with a limit only. */
                orders_remaining?: number | null;
            };
            rules: string[];
            activation: {
                /** @constant */
                method?: "link";
                /**
                 * Format: uri
                 * @description Your tracked buy link for this event.
                 */
                url?: string;
            };
            matching: {
                /** @constant */
                link_attribution?: true;
                /** @constant */
                card_transactions?: false;
                note?: string;
            };
            settlement: {
                /** @constant */
                report?: "/v1/earnings";
                /** @constant */
                webhook?: "earnings.changed";
                available?: string;
            };
            /** @constant */
            commercial_model: "CARD_LINKED";
            /** Format: uri */
            event_url: string;
            test: boolean;
            /** Format: date-time */
            updated_at: string;
        };
        Problem: {
            /** Format: uri */
            type: string;
            /** @example We could not find that city. */
            title: string;
            status: number;
            detail: string;
            request_id: string;
            code: string;
        };
    };
    responses: {
        /** @description RFC 6749 §5.2 error — invalid_request, invalid_client, unauthorized_client, unsupported_grant_type or invalid_scope. */
        OAuthError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    error: string;
                    error_description: string;
                    request_id: string;
                };
            };
        };
        /** @description Something to fix, explained in plain words (RFC 9457). */
        Problem: {
            headers: {
                "TimTim-Request-Id": components["headers"]["RequestId"];
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: {
        /** @description Send this to TimTim.Live support and we can find your request. */
        RequestId: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listEvents: {
        parameters: {
            query?: {
                /** @example Washington */
                city?: string;
                /** @example US */
                country?: string;
                /** @example music */
                category?: string;
                from?: string;
                to?: string;
                changed_since?: string;
                /** @description true = only events that pay a reward. */
                commissioned?: boolean;
                /** @description Only events paying at least this much per ticket. Implies commissioned=true. */
                minimum_earnings?: number;
                /** @example Paris,FR */
                near?: string;
                /** @description Performer name contains this text. */
                artist?: string;
                lat?: number;
                lng?: number;
                /** @description Kilometres. */
                radius?: number;
                limit?: number;
                /** @description The `next` value from the previous page. */
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of events. */
            200: {
                headers: {
                    "TimTim-Request-Id": components["headers"]["RequestId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "list";
                        /** @enum {string} */
                        mode: "test" | "live";
                        events: components["schemas"]["Event"][];
                        next: string | null;
                        /** @description Only when you send changed_since. Events you may have shown that are no longer shared with partners, withdrawn after that time — stop showing each id. Up to 500; if you get 500, ask again with changed_since set to the last withdrawn_at. Never says why. Always empty for a test key. */
                        withdrawn?: components["schemas"]["Withdrawn"][];
                        notices?: string[];
                    };
                };
            };
            400: components["responses"]["Problem"];
            401: components["responses"]["Problem"];
            403: components["responses"]["Problem"];
            429: components["responses"]["Problem"];
        };
    };
    listDemoEvents: {
        parameters: {
            query?: {
                /** @example Miami */
                city?: string;
                /** @example US */
                country?: string;
                /** @example music */
                category?: string;
                from?: string;
                to?: string;
                /** @example Paris,FR */
                near?: string;
                artist?: string;
                limit?: number;
                cursor?: string;
                /** @description Sandbox only. See above. */
                simulate?: "sold_out" | "cancelled" | "rescheduled" | "postponed" | "invalid_key" | "rate_limited";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of sample events. */
            200: {
                headers: {
                    "TimTim-Request-Id": components["headers"]["RequestId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "list";
                        /** @constant */
                        mode: "test";
                        events: components["schemas"]["Event"][];
                        next: string | null;
                        notices?: string[];
                    };
                };
            };
            400: components["responses"]["Problem"];
            401: components["responses"]["Problem"];
            429: components["responses"]["Problem"];
        };
    };
    getEvent: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @example evt_test_washington_konpa */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The event. */
            200: {
                headers: {
                    "TimTim-Request-Id": components["headers"]["RequestId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "event";
                        /** @enum {string} */
                        mode: "test" | "live";
                        event: components["schemas"]["Event"];
                    };
                };
            };
            404: components["responses"]["Problem"];
            /** @description The event was withdrawn — it is no longer shared with partners (problem event_withdrawn). Stop showing it. */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
        };
    };
    listEarnings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Your earnings. */
            200: {
                headers: {
                    "TimTim-Request-Id": components["headers"]["RequestId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "earnings";
                        /** @enum {string} */
                        mode: "test" | "live";
                        currency: string;
                        totals: {
                            pending?: number;
                            approved?: number;
                            ready?: number;
                            paid?: number;
                            reversed?: number;
                        };
                        earnings: components["schemas"]["Earning"][];
                        notices?: string[];
                    };
                };
            };
            403: components["responses"]["Problem"];
        };
    };
    bulkFeed: {
        parameters: {
            query?: {
                changed_since?: string;
            };
            header?: never;
            path: {
                file: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The gzipped file. TimTim-Bulk-Kind says full or changes; TimTim-Bulk-Content-Type is the type inside the gzip. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/gzip": string;
                };
            };
            403: components["responses"]["Problem"];
            404: components["responses"]["Problem"];
            429: components["responses"]["Problem"];
        };
    };
    listTicketTypes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The ticket types. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "list";
                        /** @enum {string} */
                        mode: "test" | "live";
                        event_id: string;
                        ticket_types: components["schemas"]["TicketType"][];
                        notices?: string[];
                    };
                };
            };
            403: components["responses"]["Problem"];
            404: components["responses"]["Problem"];
            503: components["responses"]["Problem"];
        };
    };
    createOrder: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    event_id: string;
                    ticket_type_id: string;
                    /** @default 1 */
                    quantity?: number;
                    /**
                     * Format: email
                     * @description The buyer's own email — tickets are sent there. Never returned by the API.
                     */
                    buyer_email: string;
                    buyer_name: string;
                    /** @description Your own reference; it comes back on the order, the earning and postbacks. */
                    sub_id?: string;
                };
            };
        };
        responses: {
            /** @description The order, with its payment link. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"];
                };
            };
            400: components["responses"]["Problem"];
            403: components["responses"]["Problem"];
            409: components["responses"]["Problem"];
            503: components["responses"]["Problem"];
        };
    };
    getOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The order. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"];
                };
            };
            404: components["responses"]["Problem"];
        };
    };
    listSettlements: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Your terms (if agreed) and up to 36 statements, newest first. */
            200: {
                headers: {
                    "TimTim-Request-Id": components["headers"]["RequestId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "list";
                        /** @enum {string} */
                        mode: "test" | "live";
                        terms: {
                            /** @enum {string} */
                            method?: "stripe_transfer" | "bank_transfer";
                            netDays?: number;
                            minimum?: number;
                            reference?: string | null;
                        } | null;
                        settlements: components["schemas"]["Settlement"][];
                        notices?: string[];
                    };
                };
            };
            403: components["responses"]["Problem"];
        };
    };
    listOffers: {
        parameters: {
            query?: {
                city?: string;
                country?: string;
                category?: string;
                from?: string;
                to?: string;
                changed_since?: string;
                minimum_earnings?: number;
                near?: string;
                limit?: number;
                cursor?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of offers. */
            200: {
                headers: {
                    "TimTim-Request-Id": components["headers"]["RequestId"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        object: "list";
                        /** @enum {string} */
                        mode: "test" | "live";
                        offers: components["schemas"]["Offer"][];
                        next: string | null;
                        notices?: string[];
                    };
                };
            };
            403: components["responses"]["Problem"];
        };
    };
    oauthToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/x-www-form-urlencoded": {
                    /** @constant */
                    grant_type: "client_credentials";
                    /** @description Space-separated, e.g. "events:read events:details". Default: all the client has. */
                    scope?: string;
                    client_id?: string;
                    client_secret?: string;
                };
            };
        };
        responses: {
            /** @description The token. Never cached. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example tt_at_… */
                        access_token: string;
                        /** @constant */
                        token_type: "Bearer";
                        /** @example 3600 */
                        expires_in: number;
                        scope: string;
                    };
                };
            };
            400: components["responses"]["OAuthError"];
            401: components["responses"]["OAuthError"];
        };
    };
    oauthRevoke: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/x-www-form-urlencoded": {
                    token: string;
                    client_id?: string;
                    client_secret?: string;
                };
            };
        };
        responses: {
            /** @description Done — whether or not the token existed. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["OAuthError"];
        };
    };
    eventFeed: {
        parameters: {
            query?: {
                key?: string;
                city?: string;
                country?: string;
                category?: string;
                limit?: number;
            };
            header?: never;
            path: {
                file: "events.json" | "events.rss" | "events.xml" | "events.csv" | "events.ics";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The feed. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/feed+json": unknown;
                    "application/rss+xml": unknown;
                    "application/xml": unknown;
                    "text/csv": unknown;
                    "text/calendar": unknown;
                };
            };
            401: components["responses"]["Problem"];
        };
    };
    eventChangedWebhook: {
        parameters: {
            query?: never;
            header: {
                "TimTim-Signature": string;
                "TimTim-Timestamp": string;
                "TimTim-Delivery-Id": string;
                "TimTim-Event": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    id: string;
                    /** @constant */
                    type: "event.changed";
                    /** Format: date-time */
                    created_at: string;
                    /** @enum {string} */
                    mode: "test" | "live";
                    data: {
                        event: components["schemas"]["Event"];
                    } | {
                        withdrawn: components["schemas"]["Withdrawn"];
                    };
                };
            };
        };
        responses: {
            /** @description Received. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    earningsChangedWebhook: {
        parameters: {
            query?: never;
            header: {
                "TimTim-Signature": string;
                "TimTim-Delivery-Id": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    id: string;
                    /** @constant */
                    type: "earnings.changed";
                    /** Format: date-time */
                    created_at: string;
                    /** @enum {string} */
                    mode: "test" | "live";
                    data: {
                        earning?: components["schemas"]["Earning"];
                    };
                };
            };
        };
        responses: {
            /** @description Received. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    conversionPostback: {
        parameters: {
            query?: never;
            header: {
                "TimTim-Delivery-Id": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Received. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
