import { ExtensionMessageType, onExtensionMessage } from "@/lib/messaging/messaging";
import { z } from "@/lib/zod";

const PAGE_SCRIPT_PATH = "/youtube-page.js";

const senderSchema = z.object({
  tab: z.object({ id: z.int() }),
  frameId: z.int()
});

export default defineBackground(() => {
  // Run in the page's own world by the extension API, which the page's CSP does not apply to
  onExtensionMessage(ExtensionMessageType.INJECT_PAGE_SCRIPT, async ({ sender }) => {
    const { tab, frameId } = senderSchema.parse(sender);
    await browser.scripting.executeScript({
      target: {
        tabId: tab.id,
        frameIds: [frameId]
      },
      world: "MAIN",
      files: [PAGE_SCRIPT_PATH]
    });
  });
});
