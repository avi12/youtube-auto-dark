import {
  ATTRIBUTED_STRING_SELECTOR,
  readLearnedAttributedStrings,
  remapAttributedStrings,
  rerenderAttributedStrings
} from "@/features/live-theme/page/attributed-text/attributed-string-host";
import { type ThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { type Theme } from "@/lib/theme/theme";

/** The renderer writes each run's resolved color inline, so a stale one is any inline color */
const RENDERED_COLOR_SELECTOR = "[style*='color']";

/**
 * Re-renders every attributed string whose colors were resolved for the old theme, translating colors the server
 * baked into the data; the pairs it learns on the way join `colorPairs`
 */
export async function rethemeAttributedStrings({ theme, colorPairs }: { theme: Theme; colorPairs: ThemeColorPairs }) {
  const elements = [...document.querySelectorAll(ATTRIBUTED_STRING_SELECTOR)].filter(
    element => element.querySelector(RENDERED_COLOR_SELECTOR) !== null
  );
  await rerenderAttributedStrings(
    remapAttributedStrings({
      strings: readLearnedAttributedStrings({
        elements,
        colorPairs
      }),
      colorPairs,
      theme
    })
  );
}
