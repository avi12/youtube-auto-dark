import { defineExtensionMessaging } from "@webext-core/messaging";
import { defineWindowMessaging } from "@webext-core/messaging/page";

import type { ThemeChange } from "@/lib/theme/theme-change";

/** Every message the extension's scripts send each other, so each name has one spelling */
export enum MessageType {
  /** The isolated script tells the page script of a switch it has written to the DOM (window messaging) */
  APPLY_THEME = "applyTheme",
  /** The isolated script asks the background to run the page script in the page's own world (extension messaging) */
  INJECT_PAGE_SCRIPT = "injectPageScript"
}

interface ProtocolMap {
  [MessageType.APPLY_THEME]: (change: ThemeChange) => void;
  [MessageType.INJECT_PAGE_SCRIPT]: () => void;
}

/** The page's scripts see every window message, so these carry a namespace of their own and are validated on receipt */
export const windowMessenger = defineWindowMessaging<ProtocolMap>({ namespace: "youtube-auto-dark" });
export const extensionMessenger = defineExtensionMessaging<ProtocolMap>();
