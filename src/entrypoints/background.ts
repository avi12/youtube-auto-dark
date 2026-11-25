import { extensionMessenger, MessageType } from "@/lib/messaging/messaging";

const PAGE_SCRIPT_PATH = "/youtube-page.js";

export default defineBackground(() => {
  // Run in the page's own world by the extension API, which the page's CSP does not apply to
  extensionMessenger.onMessage(MessageType.INJECT_PAGE_SCRIPT, async ({ sender }) => {
    // A content script's message always carries its tab and frame; the type marks them optional for other senders
    const { tab, frameId } = sender;
    if (tab?.id === undefined || frameId === undefined) {
      return;
    }

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
