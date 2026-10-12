import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import { siteConfig } from "./src/config/site.config";

export default defineConfig({
  integrations: [sitemap()],
  output: "static",
  image: { service: { entrypoint: "./src/services/sharp-compat.mjs" } },
  site: siteConfig.baseUrl,
});
