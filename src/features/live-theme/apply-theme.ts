import { rethemeAttributedStrings } from "@/features/live-theme/page/attributed-text/rerender-attributed-strings";
import { type ThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { syncCachedThemeProperties } from "@/features/live-theme/page/cached-theme-properties";
import { syncCinematics } from "@/features/live-theme/page/cinematics";
import { repaintColorPalettes } from "@/features/live-theme/page/color-palettes";
import { applyDocumentTheme } from "@/features/live-theme/page/document-theme";
import { rethemeLiveChat } from "@/features/live-theme/page/live-chat/retheme-live-chat";
import { syncMasthead } from "@/features/live-theme/page/masthead";
import { runThemeActions } from "@/features/live-theme/page/theme-toggled-action";
import { Theme } from "@/lib/theme/theme";

/**
 * Re-themes the loaded page the way YouTube would if it didn't reload: the theme attributes every token and component
 * reads, the values components cached from them, YouTube's own theme action, then the palettes and text colored for
 * the old theme
 */
export async function applyTheme({ theme, colorPairs }: { theme: Theme; colorPairs: ThemeColorPairs }) {
  const isDark = theme === Theme.DARK;
  applyDocumentTheme(theme);
  syncCachedThemeProperties(isDark);
  syncMasthead(isDark);
  syncCinematics(isDark);
  runThemeActions(isDark);
  rethemeLiveChat(theme);
  repaintColorPalettes();
  await rethemeAttributedStrings({
    theme,
    colorPairs
  });
}
