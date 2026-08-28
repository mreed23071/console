import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Deliberately separate from vite.config.ts.
 *
 * The app's Vite config runs through @lovable.dev/vite-tanstack-config, which
 * installs the TanStack Start plugin chain, Nitro and Tailwind. None of that is
 * needed to exercise pure functions, and loading it makes the test run slower
 * and far more fragile. This config resolves the `@/` alias and nothing else.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
