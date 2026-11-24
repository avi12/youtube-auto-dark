import { join } from "node:path";

import webExtRun from "web-ext-run";

import { claimFreePort, LOOPBACK_HOST, portSchema } from "#dev/server/ports";
import { reloadChromeYouTubeTabs } from "#dev/tab-reload/chrome-tab-reload";
import { type BrowserTarget, USER_PROFILES_DIR, webExtRunBaseOptions } from "#dev/targets/browser-target";
import { CHROME_PROFILE_NAME, setupChromeProfile } from "#dev/targets/chromium/chrome-profile";

/** Clear of sibling dev servers' ports (9222 is what other apps' WebView2 debuggers grab first) */
const CHROME_CDP_PORT = portSchema.parse(9270);
const OUT_DIR_TEMPLATE = "chrome-mv3-development";
const PROFILE_DIR = join(USER_PROFILES_DIR, "chrome");

async function launchChrome(profileDirectory: string) {
  const cdpPort = await claimFreePort({
    preferredPort: CHROME_CDP_PORT,
    label: "Chrome CDP"
  });

  const runner = await webExtRun.cmd.run(
    {
      target: "chromium",
      ...webExtRunBaseOptions({ outDirTemplate: OUT_DIR_TEMPLATE }),
      chromiumProfile: profileDirectory,
      args: [
        `--remote-debugging-address=${LOOPBACK_HOST}`,
        `--remote-debugging-port=${cdpPort}`,
        "--no-first-run",
        "--no-default-browser-check",
        `--profile-directory=${CHROME_PROFILE_NAME}`,
        "--disable-blink-features=AutomationControlled",
        "--mute-audio"
      ]
    },
    { shouldExitProgram: false }
  );
  return {
    runner,
    reloadYouTubeTabs: () => reloadChromeYouTubeTabs(cdpPort)
  };
}

export const chromeTarget: BrowserTarget = {
  name: "Chrome",
  wxtBrowser: "chrome",
  outDirTemplate: OUT_DIR_TEMPLATE,
  setupProfile: () => setupChromeProfile(PROFILE_DIR),
  launch: launchChrome
};
