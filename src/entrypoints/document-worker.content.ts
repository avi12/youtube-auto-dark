import { startDocumentWorker } from "@/features/live-theme/document/document-worker";
import { YOUTUBE_MATCHES } from "@/lib/youtube/site";

export default defineContentScript({
  matches: YOUTUBE_MATCHES,
  runAt: "document_start",
  main: startDocumentWorker
});
