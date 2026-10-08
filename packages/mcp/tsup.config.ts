import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", cli: "src/cli.ts" },
  format: ["esm"],
  dts: { entry: { index: "src/index.ts" } },
  sourcemap: true,
  clean: false,
  target: "node18",
  platform: "node",
  external: ["@modelcontextprotocol/sdk", "@timtim-live/events", "zod"],
  tsconfig: "tsconfig.build.json",
});
