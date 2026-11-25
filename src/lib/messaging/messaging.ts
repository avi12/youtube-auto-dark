import { defineExtensionMessaging } from "@webext-core/messaging";
import { defineWindowMessaging } from "@webext-core/messaging/page";

import type { Theme } from "@/lib/theme/theme";

/** Every message between the page's MAIN world and the extension's isolated world, so each name has one spelling */
export enum WindowMessageType {
  /** MAIN asks the isolated script to write the theme attributes: the DOM is its to modify */
  APPLY_DOCUMENT_THEME = "applyDocumentTheme"
}

interface WindowProtocolMap {
  [WindowMessageType.APPLY_DOCUMENT_THEME]: (theme: Theme) => void;
}

/** The page's scripts see every window message, so these carry a namespace of their own and are validated on receipt */
export const { sendMessage: sendWindowMessage, onMessage: onWindowMessage } = defineWindowMessaging<WindowProtocolMap>({
  namespace: "youtube-auto-dark"
});

/** Every message from the extension's content scripts to its background */
export enum ExtensionMessageType {
  /** The isolated script asks the background to run the page script in the page's own world */
  INJECT_PAGE_SCRIPT = "injectPageScript"
}

interface ExtensionProtocolMap {
  [ExtensionMessageType.INJECT_PAGE_SCRIPT]: () => void;
}

export const { sendMessage: sendExtensionMessage, onMessage: onExtensionMessage } =
  defineExtensionMessaging<ExtensionProtocolMap>();
