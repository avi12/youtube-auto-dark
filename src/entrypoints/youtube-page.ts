import { startLiveThemeSync } from "@/features/live-theme/sync-live-theme";

// YouTube's components, their Polymer controllers and its action router only exist in the page's own world, so the
// background injects this script there once YouTube has rendered its first page
export default defineUnlistedScript(startLiveThemeSync);
