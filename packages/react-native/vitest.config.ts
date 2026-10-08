import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    /* Test against the sources, so a change in the SDK or the React hook is tested here without a build. */
    alias: {
      "@timtim-live/events": fileURLToPath(new URL("../events-js/src/index.ts", import.meta.url)),
      "@timtim-live/react": fileURLToPath(new URL("../react/src/index.tsx", import.meta.url)),
      /* react-native cannot run in Node; the test file replaces it with plain host components. */
      "react-native": fileURLToPath(new URL("./test/react-native-stub.tsx", import.meta.url)),
    },
  },
  test: {
    name: "react-native",
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
