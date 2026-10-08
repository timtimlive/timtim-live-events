/*
 * @timtim-live/react-native — live events from TimTim.Live in an iOS or
 * Android app built with React Native or Expo.
 *
 *   <TimTimEventList city="Miami" category="music" />
 *
 * Thin on purpose: the data comes from @timtim-live/react's useTimTimEvents()
 * (which uses @timtim-live/events), so the app gets the same events, ids and
 * rules as every website. This file only draws them with native components.
 *
 * Safety: a server key (tt_sk_live_…) is refused — anyone can read an app's
 * files. Only https images and ticket links are used. Ticket links open in
 * the system browser exactly as given, so the partner keeps the credit.
 */
import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { ActivityIndicator, FlatList, Image, Linking, Pressable, StyleSheet, Text, View, type ListRenderItem, type StyleProp, type ViewStyle } from "react-native";
import { TimTimEvents as TimTimClient, type Event } from "@timtim-live/events";
import { safeHttpsUrl, useTimTimEvents, type UseTimTimEventsParams } from "@timtim-live/react";

export { TimTimProvider, useTimTimEvents, safeHttpsUrl } from "@timtim-live/react";
export type { UseTimTimEventsParams, UseTimTimEventsResult } from "@timtim-live/react";
export type { Event, EventList } from "@timtim-live/events";

export interface TimTimEventListLabels {
  loading: string;
  empty: string;
  error: string;
  retry: string;
  getTickets: string;
  sample: string;
  /** "{price}" is replaced by the formatted price. */
  from: string;
  free: string;
  status: Partial<Record<Event["status"], string>>;
}

export const DEFAULT_LABELS: TimTimEventListLabels = {
  loading: "Loading events…",
  empty: "No events here yet.",
  error: "We could not load events right now.",
  retry: "Try again",
  getTickets: "Get tickets",
  sample: "Sample — no real money",
  from: "From {price}",
  free: "Free",
  status: { cancelled: "Cancelled", postponed: "Postponed", rescheduled: "Rescheduled", sold_out: "Sold out", completed: "Ended" },
};

const NO_BUY_STATUS = new Set(["cancelled", "sold_out", "completed"]);
const NO_BUY_AVAILABILITY = new Set(["sold_out", "ended", "not_on_sale"]);

/** The ticket link to open, or null when there is nothing to buy (cancelled, sold out, ended, or not https). */
export function ticketLink(e: Event): string | null {
  const href = safeHttpsUrl(e.tickets?.buy_url);
  if (!href || NO_BUY_STATUS.has(e.status) || NO_BUY_AVAILABILITY.has(e.tickets?.availability ?? "")) return null;
  return href;
}

/** "From $30.00", "Free", or "" — in the given language. */
export function priceText(e: Event, labels: TimTimEventListLabels, locale = "en"): string {
  const t = e.tickets;
  if (t?.from == null) return "";
  if (t.from === 0) return labels.free;
  try {
    return labels.from.replace("{price}", new Intl.NumberFormat(locale, { style: "currency", currency: t.currency || "USD" }).format(t.from));
  } catch {
    return labels.from.replace("{price}", `${t.from} ${t.currency ?? ""}`.trim());
  }
}

export interface TimTimEventListProps extends UseTimTimEventsParams {
  /** "City" or "City,CC" — a shortcut for city + country. */
  location?: string;
  /** Your website key (tt_pk_live_…) or test key. Leave out for sample events. */
  apiKey?: string;
  baseUrl?: string;
  labels?: Partial<TimTimEventListLabels>;
  /** Language for prices (words come from `labels`). */
  locale?: string;
  /** Button color. */
  color?: string;
  /** Tell TimTim.Live what was shown and tapped, so your dashboard counts it. Default true; never money. */
  tracking?: boolean;
  /** Called instead of opening the ticket link, if you want to handle it yourself (still use the link as given). */
  onPressTickets?: (event: Event, url: string) => void;
  /** Draw each event yourself. */
  renderEvent?: (event: Event) => ReactElement;
  style?: StyleProp<ViewStyle>;
}

function parseLocation(value?: string): { city?: string; country?: string } {
  if (!value) return {};
  const parts = value.split(",").map((p) => p.trim());
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return /^[A-Za-z]{2}$/.test(last) ? { city: parts.slice(0, -1).join(", ") || undefined, country: last.toUpperCase() } : { city: value.trim() };
}

function randomViewId(): string {
  let s = "pv_";
  for (let i = 0; i < 24; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

/** A ready-made list of events: picture, name, date and place, price, and a "Get tickets" button. */
export function TimTimEventList({ location, apiKey, baseUrl, labels: given, locale = "en", color = "#0e7490", tracking = true, onPressTickets, renderEvent, style, ...params }: TimTimEventListProps) {
  const labels = { ...DEFAULT_LABELS, ...given, status: { ...DEFAULT_LABELS.status, ...given?.status } };
  const fromLocation = parseLocation(location);
  const query = { ...params, city: params.city ?? fromLocation.city, country: params.country ?? fromLocation.country, limit: params.limit ?? 10 };
  const { events, loading, error, refetch } = useTimTimEvents(query, { apiKey, baseUrl });

  /* A client only for the tracking signals; a server key is refused here too. */
  const tracker = useMemo(() => {
    try {
      return new TimTimClient({ apiKey, baseUrl });
    } catch {
      return null;
    }
  }, [apiKey, baseUrl]);
  const view = useRef(randomViewId()).current;
  const silent = !tracking || Boolean(params.simulate);
  const signal = (type: "impression" | "event_click", eventId?: string, shown?: number) => {
    if (silent || !tracker) return;
    void tracker.track({ type, view, ...(eventId ? { event_id: eventId } : {}), ...(shown != null ? { shown } : {}) }).catch(() => {});
  };
  const shownKey = events.map((e) => e.id).join(",");
  useEffect(() => {
    if (events.length) signal("impression", undefined, events.length);
  }, [shownKey]); // once per new set of events shown

  if (loading) {
    return (
      <View style={[styles.state, style]} accessibilityRole="progressbar" accessibilityLabel={labels.loading}>
        <ActivityIndicator />
        <Text style={styles.note}>{labels.loading}</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.state, style]}>
        <Text style={styles.note} accessibilityRole="alert">{labels.error}</Text>
        <Pressable onPress={refetch} accessibilityRole="button" style={styles.retry}>
          <Text style={styles.retryText}>{labels.retry}</Text>
        </Pressable>
      </View>
    );
  }

  const open = (e: Event) => {
    const url = ticketLink(e);
    if (!url) return;
    signal("event_click", e.id);
    if (onPressTickets) onPressTickets(e, url);
    else void Linking.openURL(url);
  };

  const renderItem: ListRenderItem<Event> = ({ item: e }) => {
    if (renderEvent) return renderEvent(e);
    const image = safeHttpsUrl(e.image);
    const status = e.status !== "scheduled" ? labels.status[e.status] : undefined;
    const where = [e.location?.venue, e.location?.city].filter(Boolean).join(", ");
    const meta = [e.display?.date_label || e.date, where].filter(Boolean).join(" · ");
    const price = priceText(e, labels, locale);
    const link = ticketLink(e);
    return (
      <View style={styles.card} testID={`timtim-event-${e.id}`}>
        {image ? <Image source={{ uri: image }} style={styles.image} accessibilityIgnoresInvertColors /> : null}
        <View style={styles.body}>
          {e.test || status ? (
            <View style={styles.badges}>
              {e.test ? <Text style={styles.badge}>{labels.sample}</Text> : null}
              {status ? <Text style={[styles.badge, styles.status]}>{status}</Text> : null}
            </View>
          ) : null}
          <Text style={styles.name} accessibilityRole="header">{e.name}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          {price ? <Text style={styles.price}>{price}</Text> : null}
          {link ? (
            <Pressable onPress={() => open(e)} accessibilityRole="link" accessibilityLabel={`${labels.getTickets}: ${e.name}`} style={[styles.buy, { backgroundColor: color }]}>
              <Text style={styles.buyText}>{labels.getTickets}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={style}
      data={events}
      keyExtractor={(e) => e.id}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.note}>{labels.empty}</Text>}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, padding: 12 },
  state: { padding: 16, alignItems: "center", gap: 8 },
  note: { fontSize: 15, color: "#475569", textAlign: "center" },
  retry: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#f1f5f9" },
  body: { padding: 14, gap: 4 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { fontSize: 11, fontWeight: "800", color: "#92400e", backgroundColor: "#fef3c7", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  status: { color: "#991b1b", backgroundColor: "#fee2e2" },
  name: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  meta: { fontSize: 14, color: "#475569" },
  price: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  buy: { marginTop: 8, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buyText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
