/*
 * Just enough of react-native to render the list in a DOM test: each native
 * component becomes a plain element that keeps its accessibility props, so
 * the tests can look for roles, labels and text exactly as a screen reader
 * would. Linking.openURL is recorded, not followed.
 */
import { createElement, type ReactElement, type ReactNode } from "react";

type Props = Record<string, unknown> & { children?: ReactNode };

function host(tag: string) {
  return function Host({ children, accessibilityRole, accessibilityLabel, testID, onPress, source }: Props) {
    return createElement(
      tag,
      {
        role: accessibilityRole as string | undefined,
        "aria-label": accessibilityLabel as string | undefined,
        "data-testid": testID as string | undefined,
        onClick: onPress as (() => void) | undefined,
        src: (source as { uri?: string } | undefined)?.uri,
      },
      children,
    );
  };
}

export const View = host("div");
export const Text = host("span");
export const Pressable = host("button");
export const Image = host("img");
export const ActivityIndicator = host("progress");

export function FlatList<T>({ data, renderItem, keyExtractor, ListEmptyComponent }: { data: T[]; renderItem: (info: { item: T; index: number }) => ReactElement; keyExtractor: (item: T) => string; ListEmptyComponent?: ReactElement }) {
  if (!data.length) return ListEmptyComponent ?? null;
  return createElement("ul", null, data.map((item, index) => createElement("li", { key: keyExtractor(item) }, renderItem({ item, index }))));
}

export const opened: string[] = [];
export const Linking = { openURL: async (url: string) => void opened.push(url) };
export const StyleSheet = { create: <T,>(s: T): T => s };
export type ListRenderItem<T> = (info: { item: T; index: number }) => ReactElement | null;
export type StyleProp<T> = T | T[] | undefined;
export type ViewStyle = Record<string, unknown>;
