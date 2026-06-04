import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  target: "node22",
  splitting: false,
  treeshake: true,
  external: ["@nestjs/common", "@nestjs/core", "@betterlog/sdk-node"],
});
