import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "html2canvas", test: /node_modules\/html2canvas/ },
            { name: "jspdf", test: /node_modules\/jspdf/ },
            { name: "docx", test: /node_modules\/docx/ },
            { name: "xlsx", test: /node_modules\/xlsx/ },
            { name: "jszip", test: /node_modules\/jszip/ },
          ],
        },
      },
    },
  },
});
