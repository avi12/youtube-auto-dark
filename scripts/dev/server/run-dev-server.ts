import { consoleStream as webExtConsoleStream } from "web-ext-run/util/logger";

import { reloadDevEnv } from "#dev/env";
import { initDevLog, logEvent } from "#dev/log";
import { buildExtension, createSerialRunner } from "#dev/server/build";
import { ChangeKind, planChange } from "#dev/server/change-plan";
import { watchProject } from "#dev/server/watcher";
import { type BrowserTarget, type LaunchedBrowser, PROJECT_ROOT } from "#dev/targets/browser-target";

const WATCHED_PATHS = [
  "src",
  "wxt.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local"
];
const WEB_EXT_WARN_LEVEL = 40;

/** web-ext-run's info logs drown the build output; warnings and up still surface */
function quietWebExtLogs() {
  webExtConsoleStream.write = ({ level, msg: message }) => {
    if (level >= WEB_EXT_WARN_LEVEL) {
      console.warn(message);
    }
  };
}

function createChangeHandler({ target, browser }: { target: BrowserTarget; browser: LaunchedBrowser }) {
  return async (changedPaths: string[]) => {
    const changeKind = planChange(changedPaths);
    logEvent(`${changedPaths.length} file(s) changed (${changeKind}) - rebuilding`);

    if (changeKind === ChangeKind.CONFIG) {
      reloadDevEnv();
    }

    await buildExtension(target);

    await browser.runner.reloadAllExtensions();
    await browser.reloadYouTubeTabs();
    logEvent("Extension and open YouTube tabs reloaded");
  };
}

/**
 * Builds the development bundle, sideloads it into an isolated browser profile through web-ext-run, then rebuilds and
 * reloads on every save: the extension through web-ext, then its open YouTube tabs through the browser's own debugging
 * protocol, so the extension needs no dev-only permission or code
 */
export async function runDevServer(target: BrowserTarget) {
  process.chdir(PROJECT_ROOT);
  initDevLog(target.name);
  target.prepare?.();
  const profileDirectory = target.setupProfile();

  logEvent(`Building for ${target.name} (development, inline source maps)`);
  await buildExtension(target);
  quietWebExtLogs();
  const browser = await target.launch(profileDirectory);
  const { runner } = browser;
  logEvent(`${target.name} launched with the extension sideloaded - watching for changes`);

  const stopWatching = watchProject({
    root: PROJECT_ROOT,
    watchedPaths: WATCHED_PATHS,
    onChange: createSerialRunner(
      createChangeHandler({
        target,
        browser
      })
    )
  });

  let isExiting = false;
  async function exit() {
    if (isExiting) {
      return;
    }

    isExiting = true;
    logEvent("Shutting down");
    stopWatching();
    await runner.exit().catch(error => console.error(error));
    process.exit(0);
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      exit().catch(console.error);
    });
  }
  // Closing the dev browser ends the session instead of leaving a watcher with nothing attached
  runner.registerCleanup(() => {
    exit().catch(console.error);
  });
}
