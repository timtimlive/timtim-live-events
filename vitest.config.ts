import { defineConfig } from "vitest/config";

/* Unit tests for every package. Integration tests (real network) run with: npm run test:integration */
export default defineConfig({
  test: {
    projects: ["packages/events-js", "packages/web-component", "packages/react", "packages/mcp", "packages/react-native"],
  },
});
