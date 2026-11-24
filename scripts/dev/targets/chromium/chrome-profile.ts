import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

import { z } from "zod";

import { DevEnvVar } from "#dev/env-vars";
import { logEvent } from "#dev/log";
import { cloneProfileFiles } from "#dev/targets/profile-clone";

export const CHROME_PROFILE_NAME = "Default";
const SEEDED_SENTINEL = ".seeded";
const LOCALAPPDATA = process.env[DevEnvVar.LocalAppData] ?? "";

const CHROME_USER_DATA_DIRECTORIES: Partial<Record<NodeJS.Platform, string>> = {
  win32: join(LOCALAPPDATA, "Google", "Chrome", "User Data"),
  darwin: join(homedir(), "Library", "Application Support", "Google", "Chrome"),
  linux: join(homedir(), ".config", "google-chrome")
};

/** Only what keeps YouTube signed in: the cookie key (Local State), the cookies, and the profile's own settings */
const USER_DATA_FILES = ["Local State"];
const PROFILE_FILES = [
  "Preferences",
  "Secure Preferences",
  join("Network", "Cookies"),
  join("Network", "TransportSecurity")
];

const preferencesSchema = z.looseObject({
  extensions: z.looseObject({ ui: z.looseObject({}).optional() }).optional()
});

/** web-ext loads the extension through CDP, which needs developer mode - a cloned profile may have it off */
function enableDeveloperMode(profileDirectory: string) {
  const preferencesPath = join(profileDirectory, CHROME_PROFILE_NAME, "Preferences");
  mkdirSync(dirname(preferencesPath), { recursive: true });
  const stored: unknown = existsSync(preferencesPath) ? JSON.parse(readFileSync(preferencesPath, "utf-8")) : {};
  const parsed = preferencesSchema.safeParse(stored);
  const preferences = parsed.success ? parsed.data : {};
  const nextPreferences = {
    ...preferences,
    extensions: {
      ...preferences.extensions,
      ui: {
        ...preferences.extensions?.ui,
        developer_mode: true
      }
    }
  };
  writeFileSync(preferencesPath, JSON.stringify(nextPreferences));
}

/**
 * The dev Chrome runs on its OWN user-data dir, seeded once from the real profile so YouTube is signed in, and never
 * touching the real one afterwards
 */
export function setupChromeProfile(profileDirectory: string) {
  const sentinelPath = join(profileDirectory, SEEDED_SENTINEL);
  const sourceDirectory = CHROME_USER_DATA_DIRECTORIES[platform()];
  const isSeedable = !existsSync(sentinelPath) && sourceDirectory !== undefined && existsSync(sourceDirectory);
  if (isSeedable) {
    logEvent(`Seeding the dev Chrome profile from ${sourceDirectory}`);
    cloneProfileFiles({
      sourceDirectory,
      destinationDirectory: profileDirectory,
      files: USER_DATA_FILES
    });
    cloneProfileFiles({
      sourceDirectory: join(sourceDirectory, process.env[DevEnvVar.DevChromeSourceProfile] ?? CHROME_PROFILE_NAME),
      destinationDirectory: join(profileDirectory, CHROME_PROFILE_NAME),
      files: PROFILE_FILES
    });
  }

  mkdirSync(profileDirectory, { recursive: true });
  writeFileSync(sentinelPath, "");
  enableDeveloperMode(profileDirectory);
  return profileDirectory;
}
