import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react()],
  resolve: {
    // Development resolves the SDK to its TypeScript sources, like the lab.
    conditions: mode === "production" ? [] : ["audiolab-source"],
  },
  server: {
    // Local only: an OBS browser source on the same machine. getUserMedia
    // needs a secure context, which 127.0.0.1 is.
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    open: false,
    // Lets `?demo=/@fs/<path>.mp3` play a local backing track in demo mode.
    fs: { strict: false },
  },
  // `npm run live`: the built overlay, same address, no hot updates (a long-lived
  // OBS source never keeps a half-updated page).
  preview: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    open: false,
  },
}));
