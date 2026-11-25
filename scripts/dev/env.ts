/**
 * Loads the development dotenv cascade into process.env before the dev modules read it (GECKO_ID), matching what WXT
 * builds with: WXT loads env for wxt.config.ts itself, a plain Node run does not. process.loadEnvFile never overwrites a set var,
 * so the most specific file loads first
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const ROOT = resolve(import.meta.dirname, "..", "..");
const ENV_FILES_MOST_SPECIFIC_FIRST = [".env.development.local", ".env.development", ".env.local", ".env"];

function existingEnvFiles() {
  return ENV_FILES_MOST_SPECIFIC_FIRST.map(file => resolve(ROOT, file)).filter(path => existsSync(path));
}

for (const path of existingEnvFiles()) {
  process.loadEnvFile(path);
}

/**
 * Re-reads the cascade and OVERWRITES process.env, so an edited value reaches the next rebuild - Vite prefers a set
 * process.env var over the file, which would otherwise freeze the startup value. Least specific first, so the most
 * specific file still wins
 */
export function reloadDevEnv() {
  for (const path of existingEnvFiles().toReversed()) {
    Object.assign(process.env, parseEnv(readFileSync(path, "utf-8")));
  }
}
