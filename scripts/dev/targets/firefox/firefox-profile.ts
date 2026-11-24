import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

import { DevEnvVar } from "#dev/env-vars";
import { logEvent } from "#dev/log";
import { cloneProfileFiles } from "#dev/targets/profile-clone";

const APPDATA = process.env[DevEnvVar.AppData] ?? "";
const FIREFOX_DATA_DIRS: Partial<Record<NodeJS.Platform, string>> = {
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
  const dataDir = FIREFOX_DATA_DIRS[platform()];
  const profilesIniPath = dataDir && join(dataDir, "profiles.ini");
  if (!dataDir || !profilesIniPath || !existsSync(profilesIniPath)) {
    return undefined;
  }

  const relativePath = INSTALL_DEFAULT_PATTERN.exec(readFileSync(profilesIniPath, "utf-8"))?.groups?.path;
  return relativePath ? join(dataDir, relativePath.trim()) : undefined;
}

function stripThemePins(profileDir: string) {
  const prefsPath = join(profileDir, "prefs.js");
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
  profileDir,
  geckoId,
  extensionUuid
}: {
  profileDir: string;
  geckoId: string;
  extensionUuid: string;
}) {
  const uuidMap = JSON.stringify({ [geckoId]: extensionUuid });
  writeFileSync(
    join(profileDir, "user.js"),
    `user_pref("extensions.webextensions.uuids", ${JSON.stringify(uuidMap)});\n`
  );
}

/** Re-cloned every launch, so a fresh login in the real Firefox reaches the dev profile on the next run */
export function setupFirefoxProfile({
  profileDir,
  geckoId,
  extensionUuid
}: {
  profileDir: string;
  geckoId: string;
  extensionUuid: string;
}) {
  mkdirSync(profileDir, { recursive: true });
  const sourceDir = findDefaultFirefoxProfile();
  if (sourceDir && existsSync(sourceDir)) {
    logEvent(`Cloning the Firefox session from ${sourceDir}`);
    cloneProfileFiles({
      sourceDir,
      destinationDir: profileDir,
      files: SESSION_FILES
    });
  }

  stripThemePins(profileDir);
  writeUserJs({
    profileDir,
    geckoId,
    extensionUuid
  });
  return profileDir;
}
