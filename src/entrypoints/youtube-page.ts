import { startLiveThemeSync } from "@/features/live-theme/sync-live-theme";

// YouTube's components, their Polymer controllers and its action router only exist in the page's own world, so the
// isolated script injects this one once it listens
export default defineUnlistedScript(startLiveThemeSync);
