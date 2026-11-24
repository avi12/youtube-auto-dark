import { cpSync, existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { z } from "zod";

import { logEvent, nodeErrorSchema } from "#dev/log";

const lockErrorSchema = nodeErrorSchema.extend({ code: z.enum(["EBUSY", "EPERM"]) });

/**
 * Copies one profile file when it exists. A running source browser holds some files (Cookies, History) open without
 * share-delete, so a locked file is skipped - the dev profile still comes up, just without that file's continuity
 */
function cloneFile({ sourcePath, destinationPath }: { sourcePath: string; destinationPath: string }) {
  if (!existsSync(sourcePath)) {
    return;
  }

  mkdirSync(dirname(destinationPath), { recursive: true });
  try {
    cpSync(sourcePath, destinationPath);
  } catch (error) {
    if (!lockErrorSchema.safeParse(error).success) {
      throw error;
    }

    logEvent(`Skipped locked profile file (source browser running?): ${basename(sourcePath)}`);
  }
}

export function cloneProfileFiles({
  sourceDir,
  destinationDir,
  files
}: {
  sourceDir: string;
  destinationDir: string;
  files: string[];
}) {
  for (const file of files) {
    cloneFile({
      sourcePath: join(sourceDir, file),
      destinationPath: join(destinationDir, file)
    });
  }
}
