import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { inspect } from "node:util";

import { z } from "zod";

/**
 * Mirrors every console line (ours and WXT's) to dev-logs/<browser>.log, so the session that died can still be read
 * after the terminal is gone. Synchronous appends keep the line that explains a crash on disk
 */
const DEV_LOG_DIR = resolve(import.meta.dirname, "..", "..", "dev-logs");
const MAX_ENTRY_CHARS = 2000;
const INSPECT_DEPTH = 2;
let devLogPath: string | undefined;

/** The `code` (and `syscall`) Node attaches to a system error */
export const nodeErrorSchema = z.object({
  code: z.string(),
  syscall: z.string().optional()
});

function formatArgument(argument: unknown) {
  return typeof argument === "string" ? argument : inspect(argument, { depth: INSPECT_DEPTH });
}

function appendToDevLog({ level, args }: { level: string; args: unknown[] }) {
  if (!devLogPath) {
    return;
  }

  const text = args.map(formatArgument).join(" ").slice(0, MAX_ENTRY_CHARS);
  appendFileSync(devLogPath, `[${new Date().toISOString()}] [${level}] ${text}\n`);
}

export function initDevLog(browserName: string) {
  mkdirSync(DEV_LOG_DIR, { recursive: true });
  devLogPath = join(DEV_LOG_DIR, `${browserName.toLowerCase()}.log`);
  writeFileSync(devLogPath, "");
  for (const level of ["log", "warn", "error"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args);
      appendToDevLog({
        level,
        args
      });
    };
  }
}

export function logEvent(message: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

/**
 * Keeps a transient browser hiccup from killing the session: unhandled rejections and uncaught exceptions are logged,
 * not fatal. A closed stdout (EPIPE) is the exception - logging it would throw again forever
 */
export function installProcessDiagnostics() {
  process.on("uncaughtException", error => {
    const parsed = nodeErrorSchema.safeParse(error);
    const isBrokenPipe = parsed.success && parsed.data.code === "EPIPE";
    if (isBrokenPipe) {
      process.exit(1);
    }

    logEvent("uncaughtException - kept alive:");
    console.error(error);
  });
  process.on("unhandledRejection", reason => {
    logEvent("unhandledRejection - kept alive:");
    console.error(reason);
  });
}
