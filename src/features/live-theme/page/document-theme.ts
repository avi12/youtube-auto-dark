import { Theme } from "@/lib/theme/theme";

export enum ThemeAttribute {
  DARK = "dark",
  LIGHT = "light"
}

/** YouTube renders its theme once per load as `<html dark>`; the app's DARK_THEME_TOKEN reads it from there */
export function readRenderedTheme() {
  return document.documentElement.hasAttribute(ThemeAttribute.DARK) ? Theme.DARK : Theme.LIGHT;
}
