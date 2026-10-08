// Bubble plugin editor → Elements → "TimTim Events" → Element actions → function(instance, properties, context)
// Paste this whole function as the element's "update" code. It runs whenever a field changes.
//
// Fields to create on the element (Fields tab), all optional:
//   location (text)  category (text)  limit (number)  layout (dropdown: grid,list,compact)
//   theme (dropdown: light,dark,auto)  color (color)  show_images (yes/no)  show_price (yes/no)
//   partner_key (text)  — a website key (tt_pk_live_…) or test key; a server key is ignored.
function(instance, properties, context) {
  var el = instance.data.el;
  if (!el) return;
  var wanted = {};
  function put(name, value) {
    if (value !== null && value !== undefined && String(value).trim() !== "") wanted[name] = String(value).trim().slice(0, 120);
  }
  put("location", properties.location);
  put("category", properties.category && String(properties.category).toLowerCase());
  if (properties.limit) put("limit", Math.min(100, Math.max(1, Math.round(properties.limit))));
  if (properties.layout && properties.layout !== "grid") put("layout", properties.layout);
  if (properties.theme && properties.theme !== "light") put("theme", properties.theme);
  if (properties.color && /^#[0-9a-fA-F]{6}$/.test(properties.color)) put("color", properties.color);
  if (properties.show_images === false) put("show-images", "false");
  if (properties.show_price === false) put("show-price", "false");
  var key = properties.partner_key ? String(properties.partner_key).trim() : "";
  if (/^(tt_pk_live_|tt_test_)[A-Za-z0-9_-]{8,128}$/.test(key)) put("partner", key);

  Array.prototype.slice.call(el.attributes).forEach(function (a) {
    if (a.name !== "style" && !(a.name in wanted)) el.removeAttribute(a.name);
  });
  Object.keys(wanted).forEach(function (name) {
    if (el.getAttribute(name) !== wanted[name]) el.setAttribute(name, wanted[name]);
  });
}
