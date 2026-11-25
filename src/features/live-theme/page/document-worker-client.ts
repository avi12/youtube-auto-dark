import { MessageType, onMessage, sendMessage } from "@/lib/messaging/messaging";
import type { Theme } from "@/lib/theme/theme";

/**
 * Resolves once the isolated script listens. Whichever script starts second finds the other: a worker that started
 * first answers this ping, one that starts later announces itself to the listener registered here
 */
function waitForDocumentWorker() {
  return new Promise<void>((resolve, reject) => {
    onMessage(MessageType.DOCUMENT_WORKER_READY, () => {
      resolve();
    });
    sendMessage(MessageType.PING).then(resolve, reject);
  });
}

const documentWorkerReady = waitForDocumentWorker();

/** Asks the isolated script to write the theme attributes, and resolves once they are written */
export async function applyDocumentTheme(theme: Theme) {
  await documentWorkerReady;
  await sendMessage(MessageType.APPLY_DOCUMENT_THEME, theme);
}
