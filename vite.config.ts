import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Optional: proxy gRPC-Web through Vite instead of calling Envoy
    // directly from the browser. Keep VITE_API_BASE_URL="" (same origin)
    // if you enable this.
    // proxy: {
    //   "^/auth.v1.AuthService": {
    //     target: "http://localhost:8080",
    //     changeOrigin: true,
    //   },
    // },
  },
});
