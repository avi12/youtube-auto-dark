import { applyTheme } from "@/features/live-theme/page/apply-theme";
import { createLateTextRepair } from "@/features/live-theme/page/attributed-text/late-text-repair";
import { createThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { createContinuationPlaceholders } from "@/features/live-theme/page/section-refetch/continuation-placeholders";
import { learnPanelColors } from "@/features/live-theme/page/section-refetch/learn-panel-colors";
import { MessageType, windowMessenger } from "@/lib/messaging/messaging";
import { themeChangeSchema } from "@/lib/theme/theme-change";

/** The page script: carries each switch the isolated script announces into YouTube's own components */
export function startThemeListener() {
  const lateTextRepair = createLateTextRepair();
  const colorPairs = createThemeColorPairs();
  const placeholders = createContinuationPlaceholders({
    onRemember(target) {
      learnPanelColors({
        target,
        colorPairs
      }).catch(console.error);
    }
  });

  windowMessenger.onMessage(MessageType.APPLY_THEME, async ({ data }) => {
    const { theme, isServerTheme, chatTokens } = themeChangeSchema.parse(data);
    // A repair still aimed at the old theme would translate this switch's own re-renders straight back
    lateTextRepair.stop();
    await applyTheme({
      theme,
      chatTokens,
      colorPairs,
      placeholders
    });

    if (!isServerTheme) {
      lateTextRepair.watch({
        theme,
        colorPairs
      });
    }
  });
}
