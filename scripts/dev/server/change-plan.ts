/** What a batch of saved files asks of the dev server */
export const ChangeKind = {
  /** Build inputs outside src/ (config, dependencies, env): refresh env, rebuild, reload */
  CONFIG: "config",
  /** Extension source: rebuild and reload, which re-injects the content script into open YouTube tabs */
  SOURCE: "source"
} as const;

const CONFIG_FILES = new Set(["wxt.config.ts", "package.json", "pnpm-lock.yaml"]);
const ENV_FILE_PREFIX = ".env";

function isConfigPath(path: string) {
  return CONFIG_FILES.has(path) || path.startsWith(ENV_FILE_PREFIX);
}

/** `changedPaths` are project-relative with forward slashes */
export function planChange(changedPaths: string[]) {
  return changedPaths.some(isConfigPath) ? ChangeKind.CONFIG : ChangeKind.SOURCE;
}
