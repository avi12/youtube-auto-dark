import { watch } from "node:fs";

/**
 * Watches the project root recursively and hands over each save as a project-relative path. A save lands in several
 * events and may be seen half written, so the caller's serial runner is what merges them: events arriving during a
 * build queue one follow-up build that reads the finished file
 */
export function watchProject({
  root,
  watchedPaths,
  onChange
}: {
  root: string;
  watchedPaths: string[];
  onChange: (changedPaths: string[]) => void;
}) {
  function isWatched(path: string) {
    return watchedPaths.some(watchedPath => path === watchedPath || path.startsWith(`${watchedPath}/`));
  }

  const watcher = watch(root, { recursive: true }, (_eventType, fileName) => {
    const path = fileName?.replaceAll("\\", "/");
    if (!path || !isWatched(path)) {
      return;
    }

    onChange([path]);
  });

  return () => {
    watcher.close();
  };
}
