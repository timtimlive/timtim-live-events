/* The two pieces of Framer's API the component uses. Property controls are recorded so the test can read them. */
export const ControlType = { String: "string", Enum: "enum", Number: "number", Boolean: "boolean", Color: "color" } as const;
export const registered = new Map<unknown, Record<string, { type: string; title?: string }>>();
/* Framer's RenderTarget: where the component is being drawn. The test moves it between the canvas and the live site. */
let target = "PREVIEW";
export const RenderTarget = { canvas: "CANVAS", export: "EXPORT", thumbnail: "THUMBNAIL", preview: "PREVIEW", current: () => target, hasRestrictions: () => target !== "PREVIEW" };
export function setRenderTarget(value: string): void {
  target = value;
}
export function addPropertyControls(component: unknown, controls: Record<string, { type: string; title?: string }>): void {
  registered.set(component, controls);
}
