import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Bind-mounted source inside Docker (macOS/Windows especially) does not emit
// inotify events reliably, so hot reload silently stops working. docker-compose
// sets VITE_USE_POLLING=true for the container; running `bun run dev` on the
// host leaves this unset and keeps native, zero-cost file watching.
const usePolling = process.env["VITE_USE_POLLING"] === "true";

// Plain client-side rendering only — no server runtime (Start/Nitro) involved.
// `tanstackRouter` is the same file-based route generator Start used
// internally, so src/routes/** is untouched; only the app's bootstrap
// (index.html + src/main.tsx) and the root route's shell changed.
export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === "development"
      ? [
          devtools({
            logging: false,
            eventBusConfig: { enabled: false },
            enhancedLogs: { enabled: false },
            consolePiping: { enabled: false },
            removeDevtoolsOnBuild: false,
            injectSource: { enabled: true },
          }),
        ]
      : []),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackRouter({ target: "react" }),
    viteReact(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  server: {
    host: "::",
    port: 8080,
    ...(usePolling ? { watch: { usePolling: true, interval: 300 } } : {}),
  },
}));
