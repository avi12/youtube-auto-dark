import { defineExtensionMessaging } from "@webext-core/messaging";
import { defineWindowMessaging } from "@webext-core/messaging/page";

import type { Theme } from "@/lib/theme/theme";

/** Every message the extension's scripts send each other, so each name has one spelling */
export enum MessageType {
  /** MAIN asks the isolated script to write the theme attributes: the DOM is its to modify (window messaging) */
  APPLY_DOCUMENT_THEME = "applyDocumentTheme",
  /** The isolated script asks the background to run the page script in the page's own world (extension messaging) */
  INJECT_PAGE_SCRIPT = "injectPageScript"
}

interface ProtocolMap {
  [MessageType.APPLY_DOCUMENT_THEME]: (theme: Theme) => void;
  [MessageType.INJECT_PAGE_SCRIPT]: () => void;
}

/** The page's scripts see every window message, so these carry a namespace of their own and are validated on receipt */
export const windowMessenger = defineWindowMessaging<ProtocolMap>({ namespace: "youtube-auto-dark" });
export const extensionMessenger = defineExtensionMessaging<ProtocolMap>();
