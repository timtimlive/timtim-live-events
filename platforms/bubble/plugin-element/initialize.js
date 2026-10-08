// Bubble plugin editor → Elements → "TimTim Events" → Element actions → function(instance, context)
// Paste this whole function as the element's "initialize" code.
//
// It creates one <timtim-events> element (the hosted TimTim.Live embed, loaded in the plugin's
// Shared → HTML header: <script src="https://timtim.live/embed/v1/timtim-events.js" defer></script>)
// and exposes what happened to the Bubble app:
//   state  event_count  (number)  — how many events are showing
//   event  events_loaded           — "When TimTim Events events_loaded" workflows run
//   event  events_failed           — when events could not be loaded
function(instance, context) {
  var el = document.createElement("timtim-events");
  el.style.display = "block";
  el.style.width = "100%";
  instance.canvas.append(el);
  instance.data.el = el;
  instance.publishState("event_count", 0);
  el.addEventListener("timtim-events-loaded", function (e) {
    instance.publishState("event_count", (e.detail && e.detail.events ? e.detail.events.length : 0));
    instance.triggerEvent("events_loaded");
  });
  el.addEventListener("timtim-events-error", function () {
    instance.publishState("event_count", 0);
    instance.triggerEvent("events_failed");
  });
}
