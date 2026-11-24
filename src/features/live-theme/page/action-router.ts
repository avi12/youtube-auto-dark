import { readControllerOf } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const APP_SELECTOR = "ytd-app";

const handlerSchema = z.function({
  input: [z.unknown()],
  output: z.unknown()
});
/** `ytd-app` keeps the app-wide action router: action name -> (registering component -> its bound handler) */
const isActionRouterOwner = createGuard(
  z.looseObject({
    actionRouter_: z.looseObject({
      actionRoutingMap: z.instanceof(Map<string, Map<unknown, z.infer<typeof handlerSchema>>>)
    })
  })
);

/**
 * Calls every handler YouTube registered for `actionName`, the way its router does - minus `ytd-app`'s, whose answer
 * to a theme change is a full reload
 */
export function callActionHandlers({ actionName, args }: { actionName: string; args: unknown[] }) {
  const appController = readControllerOf(APP_SELECTOR);
  if (!isActionRouterOwner(appController)) {
    return;
  }

  const handlers = appController.actionRouter_.actionRoutingMap.get(actionName) ?? new Map();
  for (const [owner, handler] of handlers) {
    if (owner !== appController) {
      handler(...args);
    }
  }
}
