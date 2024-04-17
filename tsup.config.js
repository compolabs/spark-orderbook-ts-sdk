import baseConfig from "@fuels/tsup-config";
import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  ...baseConfig(options, { withReact: false }),
  platform: "browser",
  entry: ["src/index.ts"],
  external: ["fuels"],
  // minify: "",
  splitting: true,
  metafile: true,
}));
