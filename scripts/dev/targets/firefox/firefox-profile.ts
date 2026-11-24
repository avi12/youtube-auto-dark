import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

import { DevEnvVar } from "#dev/env-vars";
import { logEvent } from "#dev/log";
import { cloneProfileFiles } from "#dev/targets/profile-clone";

const APPDATA = process.env[DevEnvVar.AppData] ?? "";
const FIREFOX_DATA_DIRECTORIES: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(APPDATA, "Mozilla", "Firefox"),
  darwin: join(homedir(), "Library", "Application Support", "Firefox"),
  linux: join(homedir(), ".mozilla", "firefox")
};

/** Session state only - each SQLite store's -wal holds its recent writes (a fresh YouTube login) until checkpointed */
const SESSION_FILES = [
  "cookies.sqlite",
  "cookies.sqlite-wal",
  "cert9.db",
  "permissions.sqlite",
  "permissions.sqlite-wal"
];

/**
 * Prefs that pin a theme regardless of the OS. A profile that ever carried them could never follow the device theme,
 * which is the very thing this extension reacts to
 */
const THEME_PIN_PREFS = [
  "ui.systemUsesDarkTheme",
  "browser.theme.content-theme",
  "browser.theme.toolbar-theme",
  "layout.css.prefers-color-scheme.content-override"
];

/** Modern Firefox names the profile in use in an [Install<hash>] block; the per-profile Default=1 is a legacy fallback */
const INSTALL_DEFAULT_PATTERN = /^\[Install[\dA-F]+\][\n\r]+(?:[^\n\r]*[\n\r]+)*?Default=(?<path>.+)$/m;

function findDefaultFirefoxProfile() {
  const dataDirectory = FIREFOX_DATA_DIRECTORIES[platform()];
  const profilesIniPath = dataDirectory && join(dataDirectory, "profiles.ini");
  if (!dataDirectory || !profilesIniPath || !existsSync(profilesIniPath)) {
    return undefined;
  }

  const relativePath = INSTALL_DEFAULT_PATTERN.exec(readFileSync(profilesIniPath, "utf-8"))?.groups?.path;
  return relativePath ? join(dataDirectory, relativePath.trim()) : undefined;
}

function stripThemePins(profileDirectory: string) {
  const prefsPath = join(profileDirectory, "prefs.js");
  if (!existsSync(prefsPath)) {
    return;
  }

  const lines = readFileSync(prefsPath, "utf-8").split(/\r?\n/);
  const keptLines = lines.filter(line => !THEME_PIN_PREFS.some(pref => line.includes(`"${pref}"`)));
  if (keptLines.length !== lines.length) {
    writeFileSync(prefsPath, keptLines.join("\n"));
  }
}

/** Pins the moz-extension:// UUID across sessions; user.js is merged into the prefs at every startup */
function writeUserJs({
  profileDirectory,
  geckoId,
  extensionUuid
}: {
  profileDirectory: string;
  geckoId: string;
  extensionUuid: string;
}) {
  const uuidMap = JSON.stringify({ [geckoId]: extensionUuid });
  writeFileSync(
    join(profileDirectory, "user.js"),
    `user_pref("extensions.webextensions.uuids", ${JSON.stringify(uuidMap)});\n`
  );
}

/** Re-cloned every launch, so a fresh login in the real Firefox reaches the dev profile on the next run */
export function setupFirefoxProfile({
  profileDirectory,
  geckoId,
  extensionUuid
}: {
  profileDirectory: string;
  geckoId: string;
  extensionUuid: string;
}) {
  mkdirSync(profileDirectory, { recursive: true });
  const sourceDirectory = findDefaultFirefoxProfile();
  if (sourceDirectory && existsSync(sourceDirectory)) {
    logEvent(`Cloning the Firefox session from ${sourceDirectory}`);
    cloneProfileFiles({
      sourceDirectory,
      destinationDirectory: profileDirectory,
      files: SESSION_FILES
    });
  }

  stripThemePins(profileDirectory);
  writeUserJs({
    profileDirectory,
    geckoId,
    extensionUuid
  });
  return profileDirectory;
}
