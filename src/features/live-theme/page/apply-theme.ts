import { rethemeAttributedStrings } from "@/features/live-theme/page/attributed-text/rerender-attributed-strings";
import { type ThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { syncCachedThemeProperties } from "@/features/live-theme/page/cached-theme-properties";
import { syncCinematics } from "@/features/live-theme/page/cinematics";
import { repaintColorPalettes } from "@/features/live-theme/page/color-palettes";
import { syncMasthead } from "@/features/live-theme/page/masthead";
import { rethemeLiveChat } from "@/features/live-theme/page/retheme-live-chat";
import { type ContinuationPlaceholders } from "@/features/live-theme/page/section-refetch/continuation-placeholders";
import { refetchPanelSections } from "@/features/live-theme/page/section-refetch/refetch-panel-sections";
import { runThemeActions } from "@/features/live-theme/page/theme-toggled-action";
import { Theme } from "@/lib/theme/theme";

/**
 * Re-themes the loaded page the way YouTube would if it didn't reload, once the theme attributes every token and
 * component reads are written: the values components cached from them, YouTube's own theme action, then the palettes
 * and text colored for the old theme, then panel content the server baked for it
 */
export async function applyTheme({
  theme,
  chatTokens,
  colorPairs,
  placeholders
}: {
  theme: Theme;
  chatTokens: Record<string, string> | undefined;
  colorPairs: ThemeColorPairs;
  placeholders: ContinuationPlaceholders;
}) {
  const isDark = theme === Theme.DARK;
  syncCachedThemeProperties(isDark);
  syncMasthead(isDark);
  syncCinematics(isDark);
  runThemeActions(isDark);

  if (chatTokens) {
    rethemeLiveChat(chatTokens);
  }

  repaintColorPalettes();
  await rethemeAttributedStrings({
    theme,
    colorPairs
  });
  // A response that never comes must not hold the switch, so this is not awaited
  refetchPanelSections(placeholders).catch(console.error);
}
