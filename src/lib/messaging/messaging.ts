import { defineWindowMessaging } from "@webext-core/messaging/page";

import type { Theme } from "@/lib/theme/theme";

/** Every message between the page's MAIN world and the extension's isolated world, so each name has one spelling */
export enum MessageType {
  /** MAIN asks whether the isolated script is listening yet; its answer is the first sign that it is */
  PING = "ping",
  /** The isolated script announces that it is listening, for a MAIN script that started after it */
  DOCUMENT_WORKER_READY = "documentWorkerReady",
  /** MAIN asks the isolated script to write the theme attributes: the DOM is its to modify */
  APPLY_DOCUMENT_THEME = "applyDocumentTheme"
}

interface ProtocolMap {
  [MessageType.PING]: () => void;
  [MessageType.DOCUMENT_WORKER_READY]: () => void;
  [MessageType.APPLY_DOCUMENT_THEME]: (theme: Theme) => void;
}

/** The page's scripts see every window message, so these carry a namespace of their own and are validated on receipt */
export const { sendMessage, onMessage } = defineWindowMessaging<ProtocolMap>({ namespace: "youtube-auto-dark" });
