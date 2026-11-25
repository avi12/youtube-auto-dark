import { readControllerOf } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

enum ThemeAction {
  /** What YouTube's appearance menu fires: every component registered for it re-themes itself */
  DARK_MODE_TOGGLED = "yt-dark-mode-toggled-action",
  /** Handled by `ytd-live-chat-frame`, which posts `yt-live-chat-set-dark-theme` into the live chat iframe */
  DARK_THEME = "yt-dark-theme-action",
  LIGHT_THEME = "yt-light-theme-action"
}

const handlerSchema = z.function({
  input: [z.boolean().optional()],
  output: z.unknown()
});
/** `ytd-app` keeps the app-wide action router: action name -> (registering component -> its bound handler) */
const isActionRouterOwner = createGuard(
  z.looseObject({
    actionRouter_: z.looseObject({
      actionRoutingMap: z.instanceof(Map<ThemeAction, Map<unknown, z.infer<typeof handlerSchema>>>)
    })
  })
);

/**
 * Calls every handler YouTube registered for `actionName`, the way its router does - minus `ytd-app`'s, whose answer
 * to a theme change is a full reload
 */
function callActionHandlers({
  actionName,
  actionArguments
}: {
  actionName: ThemeAction;
  actionArguments: readonly [] | readonly [boolean];
}) {
  const appController = readControllerOf("ytd-app");
  if (!isActionRouterOwner(appController)) {
    return;
  }

  const handlers = appController.actionRouter_.actionRoutingMap.get(actionName) ?? new Map();
  for (const [owner, handler] of handlers) {
    if (owner !== appController) {
      handler(...actionArguments);
    }
  }
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
