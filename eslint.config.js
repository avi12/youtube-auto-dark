import { svelte } from "eslint-config-avi12/svelte";

export default svelte({
  ignores: [
    ".output/",
    ".wxt/",
    "build/",
    "user-profiles/",
    "dev-server/target/",
    "tools/target/",
    ".chrome-for-testing/"
  ]
});
