import { readPrefEntries } from "@/features/live-theme/prefs/pref-cookie";
import { PrefFlag, readPrefFlag } from "@/features/live-theme/prefs/pref-flags";

/** YouTube's "Use device theme" appearance setting: neither an explicit dark nor an explicit light choice is saved */
export function isDeviceThemeChosen() {
  const entries = readPrefEntries();
  return ![PrefFlag.DARK_THEME, PrefFlag.LIGHT_THEME].some(flag =>
    readPrefFlag({
      entries,
      flag
    })
  );
}
