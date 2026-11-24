import { readPolymerController } from "@/features/live-theme/page/polymer";

/**
 * Properties YouTube's components seed from `<html dark>` once (constructor, attached, ready) and never re-read, such
 * as `ytd-watch-flexy.isDarkTheme`, `ytd-masthead.pageDarkTheme` and every `yt-icon.isDarkTheme`
 */
const CACHED_THEME_PROPERTIES = ["isDarkTheme", "isDarkTheme_", "isDarkMode", "isDark", "pageDarkTheme"] as const;

export function syncCachedThemeProperties(isDark: boolean) {
  for (const element of document.querySelectorAll("*")) {
    const controller = readPolymerController(element);
    if (!controller) {
      continue;
    }

    for (const property of CACHED_THEME_PROPERTIES) {
      const isCachedFlag = typeof controller[property] === "boolean";
      if (isCachedFlag) {
        controller[property] = isDark;
      }
    }
  }
}
