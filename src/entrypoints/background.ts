import { extensionMessenger, MessageType } from "@/lib/messaging/messaging";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const PAGE_SCRIPT_PATH = "/youtube-page.js";

/** Narrows the messenger's `MessageSender` to what a content script's message carries: its tab and frame */
const isContentScriptSender = createGuard(
  z.object({
    tab: z.object({ id: z.int() }),
    frameId: z.int()
  })
);

export default defineBackground(() => {
  // Run in the page's own world by the extension API, which the page's CSP does not apply to
  extensionMessenger.onMessage(MessageType.INJECT_PAGE_SCRIPT, async ({ sender }) => {
    if (!isContentScriptSender(sender)) {
      return;
    }

    await browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [sender.frameId]
      },
      world: "MAIN",
      files: [PAGE_SCRIPT_PATH]
    });
  });
});
