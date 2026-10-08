/*
 * TimTim.Live Events — a Framer code component.
 *
 * In Framer: Assets → Code → New Code File → paste this file → drag
 * "TimTim Events" onto your page → set Location, Type and the rest in the
 * property panel on the right. That is all.
 *
 * It loads the hosted TimTim.Live embed (https://timtim.live/embed/v1/timtim-events.js,
 * the open-source <timtim-events> in this repository) and passes your
 * settings to it. No event fetching here; the embed does that safely.
 *
 * Partner key: only a website key (tt_pk_live_…) or test key. A server key
 * (tt_sk_live_…) is never passed to the page.
 */
import { useEffect, useRef } from "react";
import { addPropertyControls, ControlType } from "framer";

export const EMBED_SRC = "https://timtim.live/embed/v1/timtim-events.js";

export type TimTimEventsProps = {
    location: string;
    category: string;
    limit: number;
    layout: "grid" | "list" | "compact";
    theme: "light" | "dark" | "auto";
    color: string;
    showImages: boolean;
    showPrice: boolean;
    partner: string;
    style?: Record<string, unknown>;
};

/** The attributes for <timtim-events>: only what is set, and never a server key. */
export function embedAttributes(p: Partial<TimTimEventsProps>): Record<string, string> {
    const a: Record<string, string> = {};
    if (p.location?.trim()) a.location = p.location.trim().slice(0, 120);
    if (p.category?.trim()) a.category = p.category.trim().toLowerCase();
    if (p.limit) a.limit = String(Math.min(100, Math.max(1, Math.round(p.limit))));
    if (p.layout && p.layout !== "grid") a.layout = p.layout;
    if (p.theme && p.theme !== "light") a.theme = p.theme;
    /* Framer colors may arrive as rgb(); the embed takes hex only, so anything else falls back to its default. */
    if (p.color && /^#[0-9a-fA-F]{3,8}$/.test(p.color)) a.color = p.color;
    if (p.showImages === false) a["show-images"] = "false";
    if (p.showPrice === false) a["show-price"] = "false";
    const key = p.partner?.trim();
    if (key && /^(tt_pk_live_|tt_test_)[A-Za-z0-9_-]{8,128}$/.test(key)) a.partner = key;
    return a;
}

function loadEmbed(): void {
    if (typeof document === "undefined" || document.querySelector(`script[src="${EMBED_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = EMBED_SRC;
    s.defer = true;
    document.head.appendChild(s);
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TimTimEvents(props: TimTimEventsProps) {
    const box = useRef<HTMLDivElement>(null);
    const attrs = embedAttributes(props);
    const key = JSON.stringify(attrs);

    useEffect(() => {
        loadEmbed();
        const host = box.current;
        if (!host) return;
        let el = host.querySelector("timtim-events");
        if (!el) {
            el = document.createElement("timtim-events");
            host.appendChild(el);
        }
        for (const name of Array.from(el.attributes).map((x) => x.name)) el.removeAttribute(name);
        for (const [name, value] of Object.entries(JSON.parse(key) as Record<string, string>)) el.setAttribute(name, value);
    }, [key]);

    return <div ref={box} style={{ width: "100%", ...props.style }} />;
}

TimTimEvents.defaultProps = {
    location: "Miami,US",
    category: "music",
    limit: 6,
    layout: "grid",
    theme: "light",
    color: "#0e7490",
    showImages: true,
    showPrice: true,
    partner: "",
};

addPropertyControls(TimTimEvents, {
    location: { type: ControlType.String, title: "Location", placeholder: "City or City,CC", defaultValue: "Miami,US" },
    category: {
        type: ControlType.Enum,
        title: "Type",
        options: ["", "music", "festival", "nightlife", "conference"],
        optionTitles: ["Any", "Music", "Festival", "Nightlife", "Conference"],
        defaultValue: "music",
    },
    limit: { type: ControlType.Number, title: "How many", min: 1, max: 24, step: 1, displayStepper: true, defaultValue: 6 },
    layout: { type: ControlType.Enum, title: "Layout", options: ["grid", "list", "compact"], optionTitles: ["Cards", "List", "Compact"], defaultValue: "grid" },
    theme: { type: ControlType.Enum, title: "Colors", options: ["light", "dark", "auto"], optionTitles: ["Light", "Dark", "Match visitor"], defaultValue: "light" },
    color: { type: ControlType.String, title: "Button color", placeholder: "#0e7490", defaultValue: "#0e7490" },
    showImages: { type: ControlType.Boolean, title: "Pictures", defaultValue: true },
    showPrice: { type: ControlType.Boolean, title: "Prices", defaultValue: true },
    partner: { type: ControlType.String, title: "Partner key", placeholder: "tt_pk_live_… (optional)", defaultValue: "" },
});
