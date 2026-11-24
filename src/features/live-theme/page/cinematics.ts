import { readPolymerController } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard, VOID_METHOD_SCHEMA } from "@/lib/zod-guard";

/** The components that own an ambient-mode ("cinematics") controller: Shorts and the watch page layouts */
const CINEMATICS_OWNER_SELECTOR = "ytd-shorts, ytd-watch-flexy, ytd-watch-grid";

/** YouTube's cinematics controller, recognized by shape - the field holding it on its owner is minified */
const isCinematicsController = createGuard(
  z.looseObject({
    isDarkModeEnabled: z.boolean(),
    update: VOID_METHOD_SCHEMA
  })
);

/**
 * Ambient mode only draws in dark. YouTube copies `<html dark>` into its controller once, when it is created
 * (`controller.isDarkModeEnabled = ...; controller.update()`); this does the same for the new theme
 */
export function syncCinematics(isDark: boolean) {
  for (const elOwner of document.querySelectorAll(CINEMATICS_OWNER_SELECTOR)) {
    for (const value of Object.values(readPolymerController(elOwner) ?? {})) {
      if (isCinematicsController(value)) {
        value.isDarkModeEnabled = isDark;
        value.update();
      }
    }
  }
}
