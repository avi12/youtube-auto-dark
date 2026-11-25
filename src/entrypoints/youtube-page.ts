import { startLiveThemeSync } from "@/features/live-theme/sync-live-theme";
import { YOUTUBE_MATCHES } from "@/lib/youtube/site";

export default defineContentScript({
  matches: YOUTUBE_MATCHES,
  // YouTube's components, their Polymer controllers and its action router only exist in the page's own world
  world: "MAIN",
  main: startLiveThemeSync
});
