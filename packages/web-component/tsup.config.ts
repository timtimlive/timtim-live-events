import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    target: "es2020",
    external: ["@timtim-live/events"],
    tsconfig: "tsconfig.build.json",
  },
  {
    /* dist/timtim-events.global.js — one file, everything inside, for a <script> tag. */
    entry: { "timtim-events": "src/global.ts" },
    format: ["iife"],
    globalName: "TimTimLive",
    minify: true,
    sourcemap: true,
    target: "es2020",
    noExternal: ["@timtim-live/events"],
    tsconfig: "tsconfig.build.json",
  },
]);
