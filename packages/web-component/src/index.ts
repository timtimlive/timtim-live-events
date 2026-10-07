/**
 * @timtim-live/web-component — <timtim-events>, a custom element that shows
 * TimTim.Live events on any web page (Developer Preview).
 *
 * Importing this module registers <timtim-events>.
 * Docs: https://timtim.live/developers/docs
 */
import { defineTimTimEvents } from "./element.js";

export { TimTimEventsElement, defineTimTimEvents, DEFAULT_LABELS, safeHttpsUrl } from "./element.js";
export type { TimTimEventsLabels } from "./element.js";

defineTimTimEvents();
