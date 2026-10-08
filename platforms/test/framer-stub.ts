/* The two pieces of Framer's API the component uses. Property controls are recorded so the test can read them. */
export const ControlType = { String: "string", Enum: "enum", Number: "number", Boolean: "boolean", Color: "color" } as const;
export const registered = new Map<unknown, Record<string, { type: string; title?: string }>>();
export function addPropertyControls(component: unknown, controls: Record<string, { type: string; title?: string }>): void {
  registered.set(component, controls);
}
