import { defineConfig } from "wxt";

import { YOUTUBE_MATCHES } from "./src/lib/youtube/site";

const AUTHOR_NAME = "Avi";
const AUTHOR_URL = "https://avi12.com";
const REPOSITORY_URL = "https://github.com/avi12/youtube-auto-dark";

export default defineConfig({
  manifest: ({ browser }) => ({
    name: "YouTube Auto Dark",
    description: 'Makes YouTube\'s "Use device theme" switch live the moment your system goes light or dark',
    homepage_url: REPOSITORY_URL,
    host_permissions: YOUTUBE_MATCHES,
    ...(browser === "firefox" && {
      developer: {
        name: AUTHOR_NAME,
        url: AUTHOR_URL
      },
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
