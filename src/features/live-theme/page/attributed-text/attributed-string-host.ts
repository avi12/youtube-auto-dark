import { attributedTextSchema } from "@/features/live-theme/page/attributed-text/attributed-text-schema";
import {
  learnThemeColorPairs,
  remapBakedColors,
  type ThemeColorPairs
} from "@/features/live-theme/page/attributed-text/theme-colors";
import { type Theme } from "@/lib/theme/theme";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

export const ATTRIBUTED_STRING_SELECTOR = "yt-attributed-string";

/** `yt-attributed-string` is a signal component behind a wrapper: `rawProps.data` reads its data, `setters.data` sets it */
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
        input: [attributedTextSchema],
        output: z.void()
      })
    })
  })
);

function readAttributedString(element: Element) {
  if (!isSignalHost(element)) {
    return undefined;
  }

  const parsedText = attributedTextSchema.safeParse(element.rawProps.data());
  return parsedText.success
    ? {
        text: parsedText.data,
        setData: element.setters.data
      }
    : undefined;
}

export type AttributedStringUpdate = NonNullable<ReturnType<typeof readAttributedString>>;

/** Reads every element's attributed string and teaches `colorPairs` the pairs they carry */
export function readLearnedAttributedStrings({
  elements,
  colorPairs
}: {
  elements: Iterable<Element>;
  colorPairs: ThemeColorPairs;
}) {
  const strings = [...elements].map(readAttributedString).filter(attributedString => attributedString !== undefined);
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
 * The renderer reads the theme on every render but skips data equal to what it has, so each string renders once
 * without style runs, then with its (possibly remapped) data
 */
export async function rerenderAttributedStrings(updates: AttributedStringUpdate[]) {
  for (const { setData, text } of updates) {
    setData({
      ...text,
      styleRuns: []
    });
  }
  await nextFrame();
  for (const { setData, text } of updates) {
    setData(text);
  }
}
