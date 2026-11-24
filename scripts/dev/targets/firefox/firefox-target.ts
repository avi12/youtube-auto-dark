import { join } from "node:path";

import webExtRun from "web-ext-run";

import { DevEnvVar } from "#dev/env-vars";
import { claimFreePort, portSchema } from "#dev/server/ports";
import { reloadFirefoxYouTubeTabs } from "#dev/tab-reload/firefox-tab-reload";
import { type BrowserTarget, USER_PROFILES_DIR, webExtRunBaseOptions } from "#dev/targets/browser-target";
import { endStaleDevFirefox, findFirefoxBinary } from "#dev/targets/firefox/firefox-process";
import { setupFirefoxProfile } from "#dev/targets/firefox/firefox-profile";

const OUT_DIR_TEMPLATE = "firefox-mv3-development";
const PROFILE_DIR = join(USER_PROFILES_DIR, "firefox");
/** The Remote Agent port the dev server reloads tabs through (WebDriver BiDi); next to Chrome's CDP port */
const FIREFOX_REMOTE_PORT = portSchema.parse(9272);
const DEFAULT_GECKO_ID = "youtube-auto-dark@avi12.com";
const DEFAULT_EXTENSION_UUID = "a5d0a2c1-7e3b-4f6a-9c21-0d4e8b7f3a19";

/** Firefox MV3 treats host permissions as optional; granting them up front lets the content script run at once */
const FIREFOX_PREFS = {
  "extensions.originControls.grantByDefault": true,
  "app.update.auto": false,
  "app.update.enabled": false
};

async function launchFirefox(profileDirectory: string) {
  const remotePort = await claimFreePort({
    preferredPort: FIREFOX_REMOTE_PORT,
    label: "Firefox Remote Agent"
  });

  const runner = await webExtRun.cmd.run(
    {
      target: "firefox-desktop",
      ...webExtRunBaseOptions({ outDirTemplate: OUT_DIR_TEMPLATE }),
      firefoxProfile: profileDirectory,
      firefox: findFirefoxBinary(),
      args: [`--remote-debugging-port=${remotePort}`],
      customPrefs: FIREFOX_PREFS
    },
    { shouldExitProgram: false }
  );
  return {
    runner,
    reloadYouTubeTabs: () => reloadFirefoxYouTubeTabs(remotePort)
  };
}

export const firefoxTarget: BrowserTarget = {
  name: "Firefox",
  wxtBrowser: "firefox",
  outDirTemplate: OUT_DIR_TEMPLATE,
  prepare: () => endStaleDevFirefox(PROFILE_DIR),
  setupProfile: () =>
    setupFirefoxProfile({
      profileDir: PROFILE_DIR,
      geckoId: process.env[DevEnvVar.GeckoId] ?? DEFAULT_GECKO_ID,
      extensionUuid: process.env[DevEnvVar.ExtensionUuid] ?? DEFAULT_EXTENSION_UUID
    }),
  launch: launchFirefox
};
