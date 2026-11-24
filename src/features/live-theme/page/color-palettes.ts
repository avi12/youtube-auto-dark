import { readPolymerController } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard, VOID_METHOD_SCHEMA } from "@/lib/zod-guard";

/**
 * A component colored from its data's `darkColorPalette` or `lightColorPalette` (the chapters bar of a search result,
 * for one) writes the chosen palette inline as `--yt-lightsource-*` variables, once per data change
 */
const PALETTE_HOST_SELECTOR = "[style*='--yt-lightsource-']";
const isDataChangedOwner = createGuard(
  z.looseObject({
    dataChanged: VOID_METHOD_SCHEMA
  })
);

/** Has each palette host pick its palette again - its own `dataChanged` reads `<html dark>` to choose */
export function repaintColorPalettes() {
  for (const elHost of document.querySelectorAll(PALETTE_HOST_SELECTOR)) {
    const controller = readPolymerController(elHost);
    if (isDataChangedOwner(controller)) {
      controller.dataChanged();
    }
  }
}
