import { ThemeAttribute } from "@/features/live-theme/page/document-theme";
import { MessageType, onMessage } from "@/lib/messaging/messaging";
import { Theme } from "@/lib/theme/theme";
import { z } from "@/lib/zod";

const themeSchema = z.enum(Theme);

/**
 * The server ships `:root` tokens for the theme it rendered, plus `[dark]` and `[light]` rules meant for islands. On
 * `<html>` the island re-points the tokens that variables declared there (live chat's `html[dark]` ones) resolve from,
 * but a few `:root:root` tokens outrank it, so `<body>` - which every visible surface lives under - carries it too
 */
function applyDocumentTheme(theme: Theme) {
  const isDark = theme === Theme.DARK;
  for (const elRoot of [document.documentElement, document.body]) {
    elRoot.toggleAttribute(ThemeAttribute.DARK, isDark);
    elRoot.toggleAttribute(ThemeAttribute.LIGHT, !isDark);
  }
}

/** The isolated script: it shares the page's DOM but none of its JS, so the DOM is modified from here, on request */
export function startDocumentWorker() {
  onMessage(MessageType.APPLY_DOCUMENT_THEME, ({ data }) => {
    applyDocumentTheme(themeSchema.parse(data));
  });
}
