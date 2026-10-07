import { defineConfig } from "vitest/config";

/* Calls the REAL keyless demo endpoint (https://api.timtim.live/v1/demo/events). Needs the internet. */
export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.integration.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
