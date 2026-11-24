import { resolve } from "node:path";

import type webExtRun from "web-ext-run";

import { YOUTUBE_ORIGIN } from "#dev/tab-reload/youtube-url";

export const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..");
export const USER_PROFILES_DIRECTORY = resolve(PROJECT_ROOT, "user-profiles");
const BUILD_DIRECTORY = resolve(PROJECT_ROOT, "build");

export type WebExtRunner = Awaited<ReturnType<typeof webExtRun.cmd.run>>;

/**
 * What each browser supplies to the dev server: its own profile and output directory, and how it launches. The shared
 * loop (build, watch, reload) never branches on the browser
 */
export interface BrowserTarget {
  name: string;
  wxtBrowser: "chrome" | "firefox";
  /** WXT's output folder name under build/, distinct per target so two dev servers never race one directory */
  outDirTemplate: string;
  prepare?: () => void;
  setupProfile: () => string;
  /** Starts the browser and hands back how to reload its open YouTube tabs over its debugging protocol */
  launch: (profileDirectory: string) => Promise<{
    runner: WebExtRunner;
    reloadYouTubeTabs: () => Promise<void>;
  }>;
}

function outputDirectoryOf(target: Pick<BrowserTarget, "outDirTemplate">) {
  return resolve(BUILD_DIRECTORY, target.outDirTemplate);
}

/** The web-ext-run launch options every target shares: the built extension, YouTube open, a kept profile, no prompts */
export function webExtRunBaseOptions(target: Pick<BrowserTarget, "outDirTemplate">) {
  return {
    sourceDir: outputDirectoryOf(target),
    startUrl: [YOUTUBE_ORIGIN],
    keepProfileChanges: true,
    noReload: true,
    noInput: true
  };
}
