/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BETTERLOG_API_URL: string;
  readonly VITE_BETTERLOG_PUBLISHABLE_API_KEY: string;
  readonly VITE_GATEWAY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
