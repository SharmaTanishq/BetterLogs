import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/angular/index.ts"],
  format: ["esm"],
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  target: "es2022",
  splitting: false,
  treeshake: true,
  noExternal: ["@betterlog/shared"],
  external: ["@angular/common", "@angular/core"],
});
