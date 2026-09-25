import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          // The imagery tests exercise the personal registry, which embeds vendor imagery
          // (see src/config/appMode.ts). The public registry is covered by audit:registry.
          env: { NEXT_PUBLIC_APP_MODE: "personal" },
        },
      },
      {
        plugins: [
          cloudflareTest({
            miniflare: {
              // The pool bundles its own workerd, older than the one behind wrangler.jsonc's
              // 2026-09-14. This is the newest date it accepts; raise it when the pool updates.
              compatibilityDate: "2026-08-22",
              compatibilityFlags: ["nodejs_compat"],
              d1Databases: ["DB"],
            },
          }),
        ],
        test: {
          name: "workers",
          include: ["tests/workers/**/*.test.ts"],
        },
      },
    ],
  },
});
