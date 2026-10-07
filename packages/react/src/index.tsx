/**
 * @timtim-live/react — React components and hooks for TimTim.Live events
 * (Developer Preview). Every request goes through @timtim-live/events; this
 * package only adds React state and markup.
 *
 * Docs: https://timtim.live/developers/docs
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TimTimEvents as TimTimClient, type Event, type EventList, type ListEventsParams, type Simulation } from "@timtim-live/events";

export type { Event, EventList } from "@timtim-live/events";

/* ── Provider ─────────────────────────────────────────────────────────────── */

type ClientState = { client: TimTimClient | null; error: unknown };
const ClientContext = createContext<ClientState | null>(null);

export interface TimTimProviderProps {
  /** A website key (tt_pk_live_…) or test key. Leave out for demo mode. Never a server key in a browser. */
  apiKey?: string;
  baseUrl?: string;
  /** Or pass a client you made yourself. */
  client?: TimTimClient;
  children?: ReactNode;
}

/** Shares one client with every hook and component below it. */
export function TimTimProvider({ apiKey, baseUrl, client, children }: TimTimProviderProps) {
  const value = useMemo<ClientState>(() => {
    try {
      return { client: client ?? new TimTimClient({ apiKey, baseUrl }), error: null };
    } catch (error) {
      /* e.g. a server key in a browser: every hook below reports it as its error instead of crashing the page. */
      return { client: null, error };
    }
  }, [client, apiKey, baseUrl]);
  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export type UseTimTimEventsParams = ListEventsParams & {
  /** Sandbox only: sold_out, cancelled, rescheduled, postponed, invalid_key, rate_limited. Uses the keyless demo endpoint. */
  simulate?: Simulation;
};

export interface UseTimTimEventsOptions {
  /** Overrides the provider's key for this hook. */
  apiKey?: string;
  baseUrl?: string;
  /** false = do not fetch yet. Default true. */
  enabled?: boolean;
}

export interface UseTimTimEventsResult {
  events: Event[];
  data: EventList | null;
  error: unknown;
  loading: boolean;
  refetch: () => void;
}

/**
 * Events for some filters. Re-fetches when the filters change.
 *
 *   const { events, loading, error } = useTimTimEvents({ city: "Miami", category: "music" });
 */
export function useTimTimEvents(params: UseTimTimEventsParams = {}, options: UseTimTimEventsOptions = {}): UseTimTimEventsResult {
  const fromProvider = useContext(ClientContext);
  const [state, setState] = useState<Omit<UseTimTimEventsResult, "refetch">>({ events: [], data: null, error: null, loading: options.enabled !== false });
  const [nonce, setNonce] = useState(0);
  const paramsKey = JSON.stringify(params);
  const { apiKey, baseUrl, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    (async () => {
      const own = apiKey !== undefined || baseUrl !== undefined || !fromProvider;
      if (!own && fromProvider.error) throw fromProvider.error;
      const client = own ? new TimTimClient({ apiKey, baseUrl }) : (fromProvider.client as TimTimClient);
      const { simulate, ...filters } = JSON.parse(paramsKey) as UseTimTimEventsParams;
      return simulate ? client.demo.events.list({ ...filters, simulate }) : client.events.list(filters);
    })().then(
      (data) => {
        if (!cancelled) setState({ events: data.events, data, error: null, loading: false });
      },
      (error) => {
        if (!cancelled) setState({ events: [], data: null, error, loading: false });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [paramsKey, apiKey, baseUrl, enabled, fromProvider, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, refetch };
}

/* ── Component ────────────────────────────────────────────────────────────── */

/** Only https URLs are ever used for a link or an image. */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface TimTimEventsLabels {
  loading: string;
  empty: string;
  error: string;
  retry: string;
  getTickets: string;
  sample: string;
  listLabel: string;
}

export const DEFAULT_LABELS: TimTimEventsLabels = {
  loading: "Loading events…",
  empty: "No events here yet.",
  error: "We could not load events right now.",
  retry: "Try again",
  getTickets: "Get tickets",
  sample: "Sample — no real money",
  listLabel: "Events",
};

export interface TimTimEventsProps extends UseTimTimEventsParams, UseTimTimEventsOptions {
  /** Draw it yourself. Gets the same result useTimTimEvents returns. */
  render?: (result: UseTimTimEventsResult) => ReactNode;
  labels?: Partial<TimTimEventsLabels>;
  className?: string;
}

const NO_BUY = new Set(["cancelled", "sold_out", "completed", "ended", "not_on_sale"]);

/**
 * A ready-made, unstyled list of events (class names start with `timtim-`).
 *
 *   <TimTimEvents city="Miami" category="music" />
 */
export function TimTimEvents({ render, labels, className, apiKey, baseUrl, enabled, ...params }: TimTimEventsProps) {
  const result = useTimTimEvents(params, { apiKey, baseUrl, enabled });
  if (render) return <>{render(result)}</>;
  const L = { ...DEFAULT_LABELS, ...labels };
  const { events, loading, error, refetch } = result;

  if (loading) return <p className="timtim-note" aria-busy="true">{L.loading}</p>;
  if (error) {
    return (
      <div className={className ?? "timtim-events"}>
        <p className="timtim-note" role="alert">{L.error}</p>
        <button type="button" className="timtim-retry" onClick={refetch}>
          {L.retry}
        </button>
      </div>
    );
  }
  if (!events.length) return <p className="timtim-note">{L.empty}</p>;
  return (
    <ul className={className ?? "timtim-events"} role="list" aria-label={L.listLabel}>
      {events.map((e) => {
        const img = safeHttpsUrl(e.image);
        const buy = safeHttpsUrl(e.tickets?.buy_url);
        const canBuy = buy && !NO_BUY.has(e.status) && !NO_BUY.has(e.tickets?.availability ?? "");
        const where = [e.location?.venue, e.location?.city].filter(Boolean).join(", ");
        return (
          <li key={e.id} className="timtim-event">
            <article>
              {img ? <img className="timtim-image" src={img} alt="" loading="lazy" /> : null}
              {e.test ? <span className="timtim-badge">{L.sample}</span> : null}
              <h3 className="timtim-name">{e.name}</h3>
              <p className="timtim-meta">{[e.display?.date_label, where].filter(Boolean).join(" · ")}</p>
              {e.display?.price_label ? <p className="timtim-price">{e.display.price_label}</p> : null}
              {canBuy ? (
                <a className="timtim-buy" href={buy} target="_blank" rel="noopener" aria-label={`${L.getTickets}: ${e.name}`}>
                  {L.getTickets}
                </a>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
