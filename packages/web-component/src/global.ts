/*
 * The single-file build for a plain <script> tag:
 *   <script src="timtim-events.global.js"></script>
 *   <timtim-events city="Miami" category="music"></timtim-events>
 * It bundles @timtim-live/events, registers <timtim-events>, and exposes
 * window.TimTimLive (TimTimLive.TimTimEventsElement, TimTimLive.defineTimTimEvents).
 */
export * from "./index.js";
