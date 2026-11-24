import { callActionHandlers } from "@/features/live-theme/page/action-router";

enum ThemeAction {
  /** What YouTube's appearance menu fires: every component registered for it re-themes itself */
  DARK_MODE_TOGGLED = "yt-dark-mode-toggled-action",
  /** Handled by `ytd-live-chat-frame`, which posts `yt-live-chat-set-dark-theme` into the live chat iframe */
  DARK_THEME = "yt-dark-theme-action",
  LIGHT_THEME = "yt-light-theme-action"
}

/** Runs YouTube's own theme handlers directly through its action router */
export function runThemeActions(isDark: boolean) {
  callActionHandlers({
    actionName: ThemeAction.DARK_MODE_TOGGLED,
    actionArguments: [isDark]
  });
  callActionHandlers({
    actionName: isDark ? ThemeAction.DARK_THEME : ThemeAction.LIGHT_THEME,
    actionArguments: []
  });
}
