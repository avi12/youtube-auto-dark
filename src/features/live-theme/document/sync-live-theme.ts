import { readIslandTokens } from "@/features/live-theme/document/island-tokens";
import { replayHover } from "@/features/live-theme/document/replay-hover";
import { readRenderedTheme, writeThemeAttributes } from "@/features/live-theme/document/theme-attributes";
import { isDeviceThemeChosen } from "@/features/live-theme/prefs/theme-preference";
import { extensionMessenger, MessageType, windowMessenger } from "@/lib/messaging/messaging";
import { Theme } from "@/lib/theme/theme";
import { LIVE_CHAT_IFRAME_SELECTOR } from "@/lib/youtube/site";

/**
 * Makes YouTube's "Use device theme" live. YouTube only records a device-theme change in its PREF cookie, so the next
 * server render matches, and leaves the open page as it is; this re-themes the open page in place. A user who picked
 * Dark or Light in YouTube's appearance menu is left alone
 */
async function syncLiveTheme() {
  const serverTheme = readRenderedTheme();
  // Resolves once the page script has run, so it is listening before the first switch is sent
  await extensionMessenger.sendMessage(MessageType.INJECT_PAGE_SCRIPT);
  const systemDarkQuery = matchMedia("(prefers-color-scheme: dark)");

  async function syncTheme() {
    const theme = systemDarkQuery.matches ? Theme.DARK : Theme.LIGHT;
    const isStale = isDeviceThemeChosen() && readRenderedTheme() !== theme;
    if (!isStale) {
      return;
    }

    writeThemeAttributes(theme);
    // Reading the tokens walks every stylesheet's rules, which only an open chat is worth
    const hasLiveChat = Boolean(document.querySelector(LIVE_CHAT_IFRAME_SELECTOR));
    await windowMessenger.sendMessage(MessageType.APPLY_THEME, {
      theme,
      isServerTheme: theme === serverTheme,
      chatTokens: hasLiveChat ? readIslandTokens(theme) : undefined
    });
    replayHover();
  }

  systemDarkQuery.addEventListener("change", () => {
    syncTheme().catch(console.error);
  });
  await syncTheme();
}

/**
 * The isolated script: it shares the page's DOM but none of its JS, so what needs only the DOM happens here. Both it and
 * the page script need the body and YouTube's components, which exist once YouTube announces its first rendered page
 */
export function startDocumentWorker() {
  document.addEventListener(
    "yt-navigate-finish",
    () => {
      syncLiveTheme().catch(console.error);
    },
    { once: true }
  );
}
