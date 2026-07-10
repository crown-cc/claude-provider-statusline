import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    platform: "node",
    target: "node18",
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false,
    minify: false,
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    platform: "node",
    target: "node18",
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    dts: true,
    minify: false,
  },
]);
