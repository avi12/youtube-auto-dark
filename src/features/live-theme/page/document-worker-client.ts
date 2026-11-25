import { sendWindowMessage, WindowMessageType } from "@/lib/messaging/messaging";
import type { Theme } from "@/lib/theme/theme";

/** Asks the isolated script to write the theme attributes, and resolves once they are written */
export function applyDocumentTheme(theme: Theme) {
  return sendWindowMessage(WindowMessageType.APPLY_DOCUMENT_THEME, theme);
}
