/**
 * Dev server entry. Usage:
 *   pnpm dev          - Chrome
 *   pnpm dev:firefox  - Firefox
 * Runs under tsx (Node): web-ext-run waits for the browser's debug port through Node's socket handling
 */

import "#dev/env";
import { installProcessDiagnostics, logEvent } from "#dev/log";
import { runDevServer } from "#dev/server/run-dev-server";
import { chromeTarget } from "#dev/targets/chromium/chrome-target";
import { firefoxTarget } from "#dev/targets/firefox/firefox-target";

const FIREFOX_FLAG = "--firefox";
const IS_FIREFOX = process.argv.includes(FIREFOX_FLAG);

installProcessDiagnostics();

runDevServer(IS_FIREFOX ? firefoxTarget : chromeTarget).catch(error => {
  logEvent("The dev server failed to start:");
  console.error(error);
  process.exit(1);
});
