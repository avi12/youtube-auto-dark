import { injectScript } from "wxt/utils/inject-script";

import { startDocumentWorker } from "@/features/live-theme/document/document-worker";
import { YOUTUBE_MATCHES } from "@/lib/youtube/site";

export default defineContentScript({
  matches: YOUTUBE_MATCHES,
  runAt: "document_start",
  async main() {
    startDocumentWorker();
    // Injected only now, so its messages find the worker already listening
    await injectScript("/youtube-page.js");
  }
});
