import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [angular()],
  root: "web",
  server: { port: 4200 },
  define: {
    "import.meta.env.VITE_BETTERLOG_API_URL": JSON.stringify(
      process.env.BETTERLOG_API_URL ?? "http://localhost:4000",
    ),
    "import.meta.env.VITE_BETTERLOG_PUBLISHABLE_API_KEY": JSON.stringify(
      process.env.BETTERLOG_PUBLISHABLE_API_KEY ?? "blg_publishable_dev",
    ),
    "import.meta.env.VITE_GATEWAY_URL": JSON.stringify(
      process.env.GATEWAY_URL ?? "http://localhost:3001",
    ),
  },
});
