import { readPolymerController } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

/**
 * Properties YouTube's components seed from `<html dark>` once (constructor, attached, ready) and never re-read, such
 * as `ytd-watch-flexy.isDarkTheme`, `ytd-masthead.pageDarkTheme` and every `yt-icon.isDarkTheme`
 */
const CACHED_THEME_PROPERTIES = ["isDarkTheme", "isDarkTheme_", "isDarkMode", "isDark", "pageDarkTheme"] as const;

const isFlag = createGuard(z.boolean());
/** Polymer components are custom elements, whose names carry a hyphen: no plain element is worth a controller read */
const CUSTOM_ELEMENT_NAME_MARK = "-";

export function syncCachedThemeProperties(isDark: boolean) {
  for (const elComponent of document.querySelectorAll("*")) {
    if (!elComponent.localName.includes(CUSTOM_ELEMENT_NAME_MARK)) {
      continue;
    }

    const controller = readPolymerController(elComponent);
    if (!controller) {
      continue;
    }

    for (const property of CACHED_THEME_PROPERTIES) {
      if (property in controller && isFlag(controller[property])) {
        controller[property] = isDark;
      }
    }
  }
}
