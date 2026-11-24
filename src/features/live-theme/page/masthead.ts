import { readControllerOf } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard, VOID_METHOD_SCHEMA } from "@/lib/zod-guard";

const MASTHEAD_SELECTOR = "ytd-masthead";

/**
 * The masthead outside theater mode. Its `dark` (and `isDarkThemeForced`) turn on when the server shell it upgrades from
 * was dark - which a dark theme's shell always is - so outside theater mode that dark is the theme's
 */
const isThemedMasthead = createGuard(
  z.looseObject({
    theater: z.literal(false),
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
 * Follows the theme the way the masthead's own code would. On a watch page in dark, its "cinematic" background fades in
 * with the scroll position, but only on the next scroll event - so YouTube's own `updateMastheadBackgroundOpacity` runs
 * now; leaving dark, its own `resetBackground` drops that fade, keeping the scroll position it tracks
 */
export function syncMasthead(isDark: boolean) {
  const controller = readControllerOf(MASTHEAD_SELECTOR);
  if (!isThemedMasthead(controller)) {
    return;
  }

  controller.isDarkThemeForced = false;
  controller.dark = isDark;

  if (controller.shouldShowCinematicMastHead()) {
    controller.updateMastheadBackgroundOpacity();
    return;
  }

  const { watchPageScrollTop } = controller;
  controller.resetBackground();
  controller.watchPageScrollTop = watchPageScrollTop;
}
