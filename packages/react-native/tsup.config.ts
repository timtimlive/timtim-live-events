import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: false,
  target: "es2020",
  external: ["react", "react/jsx-runtime", "react-native", "@timtim-live/events", "@timtim-live/react"],
  tsconfig: "tsconfig.build.json",
});
