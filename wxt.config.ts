import { defineConfig } from "wxt";

import packageJson from "./package.json" with { type: "json" };
import { YOUTUBE_MATCHES } from "./src/lib/youtube/site";
import { z } from "./src/lib/zod";

const { description, homepage, author } = z
  .object({
    description: z.string(),
    homepage: z.url(),
    author: z.object({
      name: z.string(),
      url: z.url()
    })
  })
  .parse(packageJson);

export default defineConfig({
  manifest: ({ browser }) => ({
    name: "YouTube Auto Dark",
    description,
    homepage_url: homepage,
    host_permissions: YOUTUBE_MATCHES,
    ...(browser === "firefox" && {
      developer: author,
      browser_specific_settings: {
        gecko: {
          id: process.env.GECKO_ID ?? "youtube-auto-dark@avi12.com",
          data_collection_permissions: {
            required: ["none"]
          }
        }
      }
    })
  }),
  srcDir: "src",
  outDir: "build",
  zip: {
    includeSources: [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "patches/**",
      "README.md",
      "LICENSE",
      "wxt.config.ts",
      "src/**"
    ],
    sourcesTemplate: "{{name}}-{{version}}-{{browser}}-source.zip"
  },
  vite: () => ({
    build: {
      sourcemap: process.env.WXT_INLINE_SOURCEMAPS ? "inline" : true
    }
  })
});
