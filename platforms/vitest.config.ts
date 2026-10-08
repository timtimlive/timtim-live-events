import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    /* Framer's runtime only exists inside Framer; the test replaces it with the two things the component uses. */
    alias: { framer: fileURLToPath(new URL("./test/framer-stub.ts", import.meta.url)) },
  },
  test: {
    name: "platforms",
    environment: "happy-dom",
    /* The components add a <script> for the hosted embed; the test never loads it (no network), and says so quietly. */
    environmentOptions: { happyDOM: { settings: { disableJavaScriptFileLoading: true, handleDisabledFileLoadingAsSuccess: true } } },
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
