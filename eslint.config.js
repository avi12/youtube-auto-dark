import { svelte } from "lint-config/eslint/svelte";

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
