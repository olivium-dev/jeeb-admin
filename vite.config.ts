import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    federation({
      name: "jeeb-admin-shell",
      remotes: {
        // Remotes are wired in later tickets (T-web-002..T-web-007). Empty
        // here so the shell builds standalone before remotes exist.
      },
      shared: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: "esnext",
    sourcemap: true,
    modulePreload: false,
    cssCodeSplit: false,
  },
});
