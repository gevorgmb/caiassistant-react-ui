/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_BASE_NGROK_URL?: string;
  readonly VITE_API_BASE_CLOUDFLARE_TUNNEL_URL?: string;
  readonly VITE_BASE_CLOUDFLARE_TUNNEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
