import { textHostDataSchema } from "@/features/live-theme/page/attributed-text/attributed-text-schema";
import { stripStyleRuns } from "@/features/live-theme/page/attributed-text/nested-style-runs";
import {
  learnThemeColorPairs,
  remapBakedColors,
  type ThemeColorPairs
} from "@/features/live-theme/page/attributed-text/theme-colors";
import { type Theme } from "@/lib/theme/theme";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

/**
 * Attributed text renders each run's resolved color inline, inside `yt-attributed-string` or, where a view model draws
 * its text itself (a channel header's handle), inside a `.ytAttributedStringHost` span
 */
const RENDERED_COLOR_SELECTOR = ":is(yt-attributed-string, .ytAttributedStringHost) [style*='color']";

/**
 * Text is rendered by signal components behind a wrapper (`yt-attributed-string`, `yt-page-header-renderer`):
 * `rawProps.data` reads their data, `setters.data` sets it
 */
const isSignalHost = createGuard(
  z.looseObject({
    rawProps: z.looseObject({
      data: z.function({
        input: [],
        output: z.unknown()
      })
    }),
    setters: z.looseObject({
      data: z.function({
        input: [textHostDataSchema],
        output: z.void()
      })
    })
  })
);

/** The nearest component rendering each colored text under `root`, `root` included */
export function findTextHosts(elRoot: Element) {
  const elColoredTexts = [...elRoot.querySelectorAll(RENDERED_COLOR_SELECTOR)];
  if (elRoot.matches(RENDERED_COLOR_SELECTOR)) {
    elColoredTexts.push(elRoot);
  }

  const elHosts = new Set<Element>();
  for (const elColoredText of elColoredTexts) {
    let elHost: Element | null = elColoredText;
    while (elHost && !isSignalHost(elHost)) {
      elHost = elHost.parentElement;
    }

    if (elHost) {
      elHosts.add(elHost);
    }
  }
  return elHosts;
}

function readAttributedString(elHost: Element) {
  if (!isSignalHost(elHost)) {
    return undefined;
  }

  const parsedText = textHostDataSchema.safeParse(elHost.rawProps.data());
  return parsedText.success
    ? {
        text: parsedText.data,
        setData: elHost.setters.data
      }
    : undefined;
}

export type AttributedStringUpdate = NonNullable<ReturnType<typeof readAttributedString>>;

/** Reads every element's attributed string and teaches `colorPairs` the pairs they carry */
export function readLearnedAttributedStrings({
  elHosts,
  colorPairs
}: {
  elHosts: Iterable<Element>;
  colorPairs: ThemeColorPairs;
}) {
  const strings = [...elHosts].map(readAttributedString).filter(attributedString => attributedString !== undefined);
  learnThemeColorPairs({
    texts: strings.map(({ text }) => text),
    colorPairs
  });
  return strings;
}

/** Each string's update with the colors the server baked for the other theme translated to `theme` */
export function remapAttributedStrings({
  strings,
  colorPairs,
  theme
}: {
  strings: AttributedStringUpdate[];
  colorPairs: ThemeColorPairs;
  theme: Theme;
}) {
  return strings.map(({ text, setData }) => ({
    setData,
    text: remapBakedColors({
      text,
      colorPairs,
      theme
    })
  }));
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * The renderer reads the theme on every render but skips data equal to what it has, so each host renders once
 * without style runs, at any depth, then with its (possibly remapped) data
 */
export async function rerenderAttributedStrings(updates: AttributedStringUpdate[]) {
  for (const { setData, text } of updates) {
    setData(textHostDataSchema.parse(stripStyleRuns(text)));
  }
  await nextFrame();
  for (const { setData, text } of updates) {
    setData(text);
  }
}
