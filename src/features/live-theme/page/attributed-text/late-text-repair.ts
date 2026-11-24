import {
  ATTRIBUTED_STRING_SELECTOR,
  readLearnedAttributedStrings,
  remapAttributedStrings,
  rerenderAttributedStrings
} from "@/features/live-theme/page/attributed-text/attributed-string-host";
import { hasBakedColor, type ThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import { type Theme } from "@/lib/theme/theme";

function collectAttributedStringElements(records: MutationRecord[]) {
  const elements = new Set<Element>();
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) {
        continue;
      }

      const elHost = node.closest(ATTRIBUTED_STRING_SELECTOR);
      if (elHost) {
        elements.add(elHost);
      }

      for (const element of node.querySelectorAll(ATTRIBUTED_STRING_SELECTOR)) {
        elements.add(element);
      }
    }
  }
  return elements;
}

/**
 * Data the page loaded with was colored by the server for its theme, so text rendered from it after a switch (a
 * collaborators dialog, a menu, an expanded description) still carries the old theme's colors. While the page shows
 * the other theme, each newly rendered attributed string with such a color is translated and re-rendered. Already
 * translated text carries no old color, so a re-render never triggers another
 */
export function createLateTextRepair() {
  let observer: MutationObserver | undefined;

  function stop() {
    observer?.disconnect();
    observer = undefined;
  }

  function watch({ theme, colorPairs }: { theme: Theme; colorPairs: ThemeColorPairs }) {
    stop();
    observer = new MutationObserver(records => {
      const strings = readLearnedAttributedStrings({
        elements: collectAttributedStringElements(records),
        colorPairs
      }).filter(({ text }) =>
        hasBakedColor({
          text,
          colorPairs,
          theme
        })
      );
      const updates = remapAttributedStrings({
        strings,
        colorPairs,
        theme
      });
      if (updates.length) {
        rerenderAttributedStrings(updates).catch(console.error);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  return {
    watch,
    stop
  };
}
