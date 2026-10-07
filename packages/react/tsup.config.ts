import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: false,
  target: "es2020",
  external: ["react", "react/jsx-runtime", "@timtim-live/events"],
  /* Hooks need the client in React Server Components frameworks (Next.js App Router). */
  banner: { js: '"use client";' },
  tsconfig: "tsconfig.build.json",
});
