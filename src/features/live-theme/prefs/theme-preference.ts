import { readPrefEntries } from "@/features/live-theme/prefs/pref-cookie";
import { PrefFlag, readPrefFlag } from "@/features/live-theme/prefs/pref-flags";

/** YouTube's "Use device theme" appearance setting: neither an explicit dark nor an explicit light choice is saved */
export function isDeviceThemeChosen() {
  const entries = readPrefEntries();
  const isDarkChosen = readPrefFlag({
    entries,
    flag: PrefFlag.DARK_THEME
  });
  const isLightChosen = readPrefFlag({
    entries,
    flag: PrefFlag.LIGHT_THEME
  });
  return !isDarkChosen && !isLightChosen;
}
