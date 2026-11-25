import { defineWindowMessaging } from "@webext-core/messaging/page";

import type { Theme } from "@/lib/theme/theme";

/** Every message between the page's MAIN world and the extension's isolated world, so each name has one spelling */
export enum MessageType {
  /** MAIN asks the isolated script to write the theme attributes: the DOM is its to modify */
  APPLY_DOCUMENT_THEME = "applyDocumentTheme"
}

interface ProtocolMap {
  [MessageType.APPLY_DOCUMENT_THEME]: (theme: Theme) => void;
}

/** The page's scripts see every window message, so these carry a namespace of their own and are validated on receipt */
export const { sendMessage, onMessage } = defineWindowMessaging<ProtocolMap>({ namespace: "youtube-auto-dark" });
