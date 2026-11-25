import {
  findTextHosts,
  readLearnedAttributedStrings,
  remapAttributedStrings,
  rerenderAttributedStrings
} from "@/features/live-theme/page/attributed-text/attributed-string-host";
import { type ThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { type Theme } from "@/lib/theme/theme";

/**
 * Re-renders every attributed string whose colors were resolved for the old theme, translating colors the server
 * baked into the data; the pairs it learns on the way join `colorPairs`
 */
export async function rethemeAttributedStrings({ theme, colorPairs }: { theme: Theme; colorPairs: ThemeColorPairs }) {
  await rerenderAttributedStrings(
    remapAttributedStrings({
      strings: readLearnedAttributedStrings({
        elHosts: findTextHosts(document.body),
        colorPairs
      }),
      colorPairs,
      theme
    })
  );
}
