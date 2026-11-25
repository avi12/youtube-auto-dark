import { build } from "wxt";

import { DevEnvVar } from "#dev/env-vars";
import { type BrowserTarget, PROJECT_ROOT } from "#dev/targets/browser-target";

const DEVELOPMENT_MODE = "development";

/** A development build (unminified, import.meta.env.DEV, inline source maps) into the target's own directory */
export async function buildExtension({
  wxtBrowser,
  outDirTemplate
}: Pick<BrowserTarget, "wxtBrowser" | "outDirTemplate">) {
  process.env[DevEnvVar.WxtInlineSourcemaps] = "1";
  await build({
    root: PROJECT_ROOT,
    browser: wxtBrowser,
    mode: DEVELOPMENT_MODE,
    outDirTemplate
  });
}

/** Builds strictly one at a time: saves landing mid-build are merged into a single follow-up run */
export function createSerialRunner(run: (changedPaths: string[]) => Promise<void>) {
  let activeRun: Promise<void> | undefined;
  const queuedPaths = new Set<string>();

  async function drain() {
    while (queuedPaths.size > 0) {
      const changedPaths = [...queuedPaths];
      queuedPaths.clear();
      await run(changedPaths).catch(error => console.error(error));
    }
    activeRun = undefined;
  }

  return (changedPaths: string[]) => {
    for (const path of changedPaths) {
      queuedPaths.add(path);
    }
    activeRun ??= drain();
  };
}
