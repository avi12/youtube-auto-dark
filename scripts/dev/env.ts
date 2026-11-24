/**
 * Loads the development dotenv cascade into process.env before the dev modules read it (GECKO_ID), matching what WXT
 * builds with: WXT loads env for wxt.config.ts itself, tsx does not. process.loadEnvFile never overwrites a set var,
 * so the most specific file loads first
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const ROOT = resolve(import.meta.dirname, "..", "..");
const ENV_FILES_MOST_SPECIFIC_FIRST = [".env.development.local", ".env.development", ".env.local", ".env"];

for (const file of ENV_FILES_MOST_SPECIFIC_FIRST) {
  const path = resolve(ROOT, file);
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}

/**
 * Re-reads the cascade and OVERWRITES process.env, so an edited value reaches the next rebuild - Vite prefers a set
 * process.env var over the file, which would otherwise freeze the startup value. Least specific first, so the most
 * specific file still wins
 */
export function reloadDevEnv() {
  for (const file of ENV_FILES_MOST_SPECIFIC_FIRST.toReversed()) {
    const path = resolve(ROOT, file);
    if (existsSync(path)) {
      Object.assign(process.env, parseEnv(readFileSync(path, "utf-8")));
    }
  }
}
