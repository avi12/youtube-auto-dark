import { readControllerOf } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard, VOID_METHOD_SCHEMA } from "@/lib/zod-guard";

const MASTHEAD_SELECTOR = "ytd-masthead";

const isMasthead = createGuard(
  z.looseObject({
    theater: z.boolean(),
    dark: z.boolean(),
    isDarkThemeForced: z.boolean(),
    watchPageScrollTop: z.number(),
    shouldShowCinematicMastHead: z.function({
      input: [],
      output: z.boolean()
    }),
    updateMastheadBackgroundOpacity: VOID_METHOD_SCHEMA,
    resetBackground: VOID_METHOD_SCHEMA
  })
);

/**
 * Follows the theme the way the masthead's own code would. Its `dark` (and `isDarkThemeForced`) turn on when the server
 * shell it upgrades from was dark - which a dark theme's shell always is - so outside theater mode, which is dark in
 * either theme, that dark is the theme's. On a watch page in dark, its "cinematic" background fades in with the scroll
 * position, but only on the next scroll event - so YouTube's own `updateMastheadBackgroundOpacity` runs now; leaving
 * dark, its own `resetBackground` drops that fade, keeping the scroll position it tracks
 */
export function syncMasthead(isDark: boolean) {
  const controller = readControllerOf(MASTHEAD_SELECTOR);
  if (!isMasthead(controller)) {
    return;
  }

  if (!controller.theater) {
    controller.isDarkThemeForced = false;
    // The searchbox's dark class is `forceDarkMode || <html dark>`, recomputed only when `forceDarkMode` (bound to
    // `dark`) changes, so `dark` passes through the other value for the binding to fire even when it already holds `isDark`
    controller.dark = !isDark;
    controller.dark = isDark;
  }

  if (controller.shouldShowCinematicMastHead()) {
    controller.updateMastheadBackgroundOpacity();
    return;
  }

  const { watchPageScrollTop } = controller;
  controller.resetBackground();
  controller.watchPageScrollTop = watchPageScrollTop;
}
