import { defineConfig } from "vite";
import vinext from "vinext";
import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";

const isPersonalBuild = process.env.NEXT_PUBLIC_APP_MODE === "personal";

export default defineConfig({
  resolve: {
    alias: isPersonalBuild
      ? []
      : [{
          find: resolve("src/worker.ts"),
          replacement: resolve("src/publicWorker.ts"),
        }, {
          find: "@/components/shell/TerrainAnalysisSheet",
          replacement: resolve("src/components/shell/PublicTerrainAnalysisSheet.tsx"),
        }, {
          find: resolve("src/app/api/terrain/threshold/route.ts"),
          replacement: resolve("src/app/api/terrain/publicThresholdRoute.ts"),
        }],
  },
  plugins: [
    vinext({
      cache: { cdn: cdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
