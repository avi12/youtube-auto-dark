import { applyTheme } from "@/features/live-theme/apply-theme";
import { createLateTextRepair } from "@/features/live-theme/page/attributed-text/late-text-repair";
import { createThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { readRenderedTheme } from "@/features/live-theme/page/document-theme";
import { isDeviceThemeChosen } from "@/features/live-theme/prefs/theme-preference";
import { Theme } from "@/lib/theme/theme";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Makes YouTube's "Use device theme" live. YouTube only records a device-theme change in its PREF cookie, so the next
 * server render matches, and leaves the open page as it is; this re-themes the open page in place. A user who picked
 * Dark or Light in YouTube's appearance menu is left alone
 */
export function startLiveThemeSync() {
  const systemDarkQuery = matchMedia(SYSTEM_DARK_QUERY);
  const serverTheme = readRenderedTheme();
  const lateTextRepair = createLateTextRepair();
  const colorPairs = createThemeColorPairs();

  async function syncTheme() {
    const theme = systemDarkQuery.matches ? Theme.DARK : Theme.LIGHT;
    const isStale = isDeviceThemeChosen() && readRenderedTheme() !== theme;
    if (!isStale) {
      return;
    }

    // A repair still aimed at the old theme would translate this switch's own re-renders straight back
    lateTextRepair.stop();
    await applyTheme({
      theme,
      colorPairs
    });
    const isServerTheme = theme === serverTheme;
    if (isServerTheme) {
      return;
    }

    lateTextRepair.watch({
      theme,
      colorPairs
    });
  }

  systemDarkQuery.addEventListener("change", () => {
    syncTheme().catch(console.error);
  });
  syncTheme().catch(console.error);
}
