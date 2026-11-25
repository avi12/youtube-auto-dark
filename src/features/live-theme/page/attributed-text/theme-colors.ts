import {
  type ArgbColor,
  InterfaceTheme,
  type StyleRun,
  type TextHostData,
  textHostDataSchema
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

/** Both directions of one pair; the first counterpart seen for a color wins */
function learnPair({
  darkColor,
  lightColor,
  colorPairs
}: {
  darkColor: ArgbColor;
  lightColor: ArgbColor;
  colorPairs: ThemeColorPairs;
}) {
  if (!colorPairs[Theme.LIGHT].has(darkColor)) {
    colorPairs[Theme.LIGHT].set(darkColor, lightColor);
  }

  if (!colorPairs[Theme.DARK].has(lightColor)) {
    colorPairs[Theme.DARK].set(lightColor, darkColor);
  }
}

function readColorMapValue({ run, key }: { run: StyleRun; key: InterfaceTheme }) {
  return run.styleRunExtensions?.styleRunColorMapExtension?.colorMap.find(entry => entry.key === key)?.value;
}

export function learnThemeColorPairs({ texts, colorPairs }: { texts: TextHostData[]; colorPairs: ThemeColorPairs }) {
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

    learnPair({
      darkColor,
      lightColor,
      colorPairs
    });
  }
}

/**
 * The same content requested once per theme has the same runs in the same order, so a bare `fontColor` that differs
 * between the two is one color's counterpart: the pairs a color map would have given, for text that has none
 */
export function learnBakedColorPairs({
  darkText,
  lightText,
  colorPairs
}: {
  darkText: TextHostData;
  lightText: TextHostData;
  colorPairs: ThemeColorPairs;
}) {
  const darkRuns = collectStyleRuns(darkText);
  const lightRuns = collectStyleRuns(lightText);
  if (darkRuns.length !== lightRuns.length) {
    return;
  }

  for (const [index, darkRun] of darkRuns.entries()) {
    const darkColor = darkRun.fontColor;
    const lightColor = lightRuns[index]?.fontColor;
    if (darkColor === undefined || lightColor === undefined || darkColor === lightColor) {
      continue;
    }

    learnPair({
      darkColor,
      lightColor,
      colorPairs
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
  text: TextHostData;
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
  text: TextHostData;
  colorPairs: ThemeColorPairs;
  theme: Theme;
}) {
  const translation = colorPairs[theme];
  return textHostDataSchema.parse(
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
