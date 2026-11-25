import { readIslandTokens } from "@/features/live-theme/page/live-chat/island-tokens";
import { isIframeElement } from "@/lib/dom-guards";
import { type Theme } from "@/lib/theme/theme";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const LIVE_CHAT_IFRAME_SELECTOR = "ytd-live-chat-frame iframe";

/** The ShadyCSS the chat's own app styles itself through (its `setGlobalDarkTheme` calls `styleSubtree`) */
const isShadyChatWindow = createGuard(
  z.looseObject({
    ShadyCSS: z.looseObject({
      styleDocument: z.function({
        input: [z.record(z.string(), z.string())],
        output: z.void()
      })
    })
  })
);

/**
 * Live chat is its own document, server-rendered with only its loaded theme's tokens, so the attribute its app
 * toggles on `yt-live-chat-set-dark-theme` recolors nothing. Its own ShadyCSS takes the token values YouTube's page
 * stylesheet declares for the new theme, and restyles the chat in place
 */
export function rethemeLiveChat(theme: Theme) {
  const tokens = readIslandTokens(theme);
  for (const elFrame of document.querySelectorAll(LIVE_CHAT_IFRAME_SELECTOR)) {
    const chatWindow = isIframeElement(elFrame) ? elFrame.contentWindow : null;
    if (isShadyChatWindow(chatWindow)) {
      chatWindow.ShadyCSS.styleDocument(tokens);
    }
  }
}
