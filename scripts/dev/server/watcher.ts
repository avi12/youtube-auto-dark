import { type FSWatcher, watch } from "node:fs";

const DEBOUNCE_MS = 300;

/**
 * Watches the project root recursively and hands over each burst of saves as one batch of project-relative paths.
 * The debounce doubles as the write-settle window, so a build never reads a half-written file
 */
export function watchProject({
  root,
  watchedPaths,
  onBatch
}: {
  root: string;
  watchedPaths: string[];
  onBatch: (changedPaths: string[]) => void;
}) {
  const pendingPaths = new Set<string>();
  let debounceTimer: NodeJS.Timeout | undefined;

  function isWatched(path: string) {
    return watchedPaths.some(watchedPath => path === watchedPath || path.startsWith(`${watchedPath}/`));
  }

  function flush() {
    const changedPaths = [...pendingPaths];
    pendingPaths.clear();
    onBatch(changedPaths);
  }

  const watcher: FSWatcher = watch(root, { recursive: true }, (_eventType, fileName) => {
    const path = fileName?.replaceAll("\\", "/");
    if (!path || !isWatched(path)) {
      return;
    }

    pendingPaths.add(path);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(flush, DEBOUNCE_MS);
  });

  return () => {
    clearTimeout(debounceTimer);
    watcher.close();
  };
}
