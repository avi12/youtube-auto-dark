import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";

const KILL_TIMEOUT_MS = 10_000;
const PROFILE_LOCK_FILES = ["parent.lock", ".parentlock", "lock"];
const WINDOWS_PROGRAM_DIRS = ["C:/Program Files", "C:/Program Files (x86)"];
const WINDOWS_FIREFOX_PATHS = WINDOWS_PROGRAM_DIRS.map(programDir =>
  join(programDir, "Mozilla Firefox", "firefox.exe")
);

/** web-ext finds Firefox itself everywhere but on some Windows installs */
export function findFirefoxBinary() {
  return platform() === "win32" ? WINDOWS_FIREFOX_PATHS.find(path => existsSync(path)) : undefined;
}

/**
 * Ends only a Firefox left over from an earlier dev session - matched by the dev profile path on its command line, so
 * the user's own Firefox windows are never touched - and clears its stale profile locks
 */
export function endStaleDevFirefox(profileDir: string) {
  if (platform() === "win32") {
    const script = `
$profileDir = '${profileDir.replaceAll("'", "''")}'
Get-CimInstance Win32_Process -Filter "name='firefox.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profileDir) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
`;
    spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", "-"], {
      input: script,
      stdio: ["pipe", "ignore", "ignore"],
      timeout: KILL_TIMEOUT_MS
    });
  }

  for (const lockFile of PROFILE_LOCK_FILES) {
    rmSync(join(profileDir, lockFile), { force: true });
  }
}
