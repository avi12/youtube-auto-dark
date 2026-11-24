import { Theme } from "@/lib/theme/theme";

enum ThemeAttribute {
  DARK = "dark",
  LIGHT = "light"
}

/** YouTube renders its theme once per load as `<html dark>`; the app's DARK_THEME_TOKEN reads it from there */
export function readRenderedTheme() {
  return document.documentElement.hasAttribute(ThemeAttribute.DARK) ? Theme.DARK : Theme.LIGHT;
}

/**
 * The server ships `:root` tokens for the theme it rendered, plus `[dark]` and `[light]` rules meant for islands. On
 * `<html>` the island re-points the tokens that variables declared there (live chat's `html[dark]` ones) resolve from,
 * but a few `:root:root` tokens outrank it, so `<body>` - which every visible surface lives under - carries it too
 */
export function applyDocumentTheme(theme: Theme) {
  const isDark = theme === Theme.DARK;
  for (const elRoot of [document.documentElement, document.body]) {
    elRoot.toggleAttribute(ThemeAttribute.DARK, isDark);
    elRoot.toggleAttribute(ThemeAttribute.LIGHT, !isDark);
  }
}
