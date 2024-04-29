import baseConfig from "@fuels/tsup-config";
import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  ...baseConfig(options, { withReact: false }),
  platform: "neutral",
  entry: ["src/index.ts"],
  external: ["fuels"],
  // minify: true,
  splitting: true,
  metafile: false,
}));
