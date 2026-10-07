import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    /* Test against the SDK's source, so a change there is tested here without a build. */
    alias: { "@timtim-live/events": fileURLToPath(new URL("../events-js/src/index.ts", import.meta.url)) },
  },
  test: {
    name: "web-component",
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
