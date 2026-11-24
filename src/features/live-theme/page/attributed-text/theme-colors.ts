import {
  type ArgbColor,
  type AttributedText,
  attributedTextSchema,
  InterfaceTheme,
  type StyleRun
} from "@/features/live-theme/page/attributed-text/attributed-text-schema";
import { collectStyleRuns, mapStyleRuns } from "@/features/live-theme/page/attributed-text/nested-style-runs";
import { Theme } from "@/lib/theme/theme";

/**
 * Per target theme, each old-theme color -> its counterpart, as YouTube's own color maps pair them (dark's `#fff` text
 * with light's `#131313`, for one). One table per direction, since a color can pair with several counterparts across
 * texts; kept for the page's lifetime, so a pair learned on one switch still serves the switch back
 */
export type ThemeColorPairs = Record<Theme, Map<ArgbColor, ArgbColor>>;

export function createThemeColorPairs() {
  const colorPairs: ThemeColorPairs = {
    [Theme.DARK]: new Map(),
    [Theme.LIGHT]: new Map()
  };
  return colorPairs;
}

function addPair({
  translation,
  fromColor,
  toColor
}: {
  translation: Map<ArgbColor, ArgbColor>;
  fromColor: ArgbColor;
  toColor: ArgbColor;
}) {
  if (!translation.has(fromColor)) {
    translation.set(fromColor, toColor);
  }
}

function readColorMapValue({ run, key }: { run: StyleRun; key: InterfaceTheme }) {
  return run.styleRunExtensions?.styleRunColorMapExtension?.colorMap.find(entry => entry.key === key)?.value;
}

export function learnThemeColorPairs({ texts, colorPairs }: { texts: AttributedText[]; colorPairs: ThemeColorPairs }) {
  for (const run of collectStyleRuns(texts)) {
    const darkColor = readColorMapValue({
      run,
      key: InterfaceTheme.DARK
    });
    const lightColor = readColorMapValue({
      run,
      key: InterfaceTheme.LIGHT
    });
    if (darkColor === undefined || lightColor === undefined) {
      continue;
    }

    addPair({
      translation: colorPairs[Theme.LIGHT],
      fromColor: darkColor,
      toColor: lightColor
    });
    addPair({
      translation: colorPairs[Theme.DARK],
      fromColor: lightColor,
      toColor: darkColor
    });
  }
}

/** A run with a color map is resolved by the renderer itself; only a bare, baked `fontColor` needs translating */
function remapRun({ run, translation }: { run: StyleRun; translation: ReadonlyMap<ArgbColor, ArgbColor> }) {
  const hasColorMap = run.styleRunExtensions?.styleRunColorMapExtension !== undefined;
  const nextColor = run.fontColor === undefined ? undefined : translation.get(run.fontColor);
  if (hasColorMap || nextColor === undefined) {
    return run;
  }

  return {
    ...run,
    fontColor: nextColor
  };
}

/** Whether any run, at any depth, carries a color the server baked for the theme other than `theme` */
export function hasBakedColor({
  text,
  colorPairs,
  theme
}: {
  text: AttributedText;
  colorPairs: ThemeColorPairs;
  theme: Theme;
}) {
  const translation = colorPairs[theme];
  return collectStyleRuns(text).some(
    run =>
      remapRun({
        run,
        translation
      }) !== run
  );
}

export function remapBakedColors({
  text,
  colorPairs,
  theme
}: {
  text: AttributedText;
  colorPairs: ThemeColorPairs;
  theme: Theme;
}) {
  const translation = colorPairs[theme];
  return attributedTextSchema.parse(
    mapStyleRuns({
      value: text,
      mapRun: run =>
        remapRun({
          run,
          translation
        })
    })
  );
}
