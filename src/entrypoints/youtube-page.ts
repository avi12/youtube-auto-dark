import { startThemeListener } from "@/features/live-theme/page/start-theme-listener";

/** Runs in the page's own world, where YouTube's objects are. The background injects it on the isolated script's request */
export default defineUnlistedScript(startThemeListener);
