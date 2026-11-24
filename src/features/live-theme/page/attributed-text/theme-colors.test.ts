import { describe, expect, it } from "vitest";

import {
  type AttributedText,
  attributedTextSchema
} from "@/features/live-theme/page/attributed-text/attributed-text-schema";
import {
  createThemeColorPairs,
  hasBakedColor,
  learnThemeColorPairs,
  remapBakedColors
} from "@/features/live-theme/page/attributed-text/theme-colors";
import { Theme } from "@/lib/theme/theme";

const WHITE = 0xff_ff_ff_ff;
const NEAR_BLACK = 0xff_13_13_13;
const UNKNOWN_COLOR = 0xff_12_34_56;

/** Text whose run YouTube gave both themes' colors - the source of the dictionary */
const DESCRIPTION = attributedTextSchema.parse({
  content: "KSI",
  styleRuns: [
    {
      startIndex: 0,
      length: 3,
      styleRunExtensions: {
        styleRunColorMapExtension: {
          colorMap: [
            {
              key: "USER_INTERFACE_THEME_DARK",
              value: WHITE
            },
            {
              key: "USER_INTERFACE_THEME_LIGHT",
              value: NEAR_BLACK
            }
          ]
        }
      }
    }
  ]
});

function bakedText(fontColor: number) {
  return attributedTextSchema.parse({
    content: "KSI and MrBeast",
    styleRuns: [
      {
        startIndex: 0,
        length: 15,
        fontColor
      }
    ]
  });
}

function learnedPairs() {
  const colorPairs = createThemeColorPairs();
  learnThemeColorPairs({
    texts: [DESCRIPTION],
    colorPairs
  });
  return colorPairs;
}

function fontColorsOf(text: AttributedText) {
  return [...JSON.stringify(text).matchAll(/"fontColor":(\d+)/g)].map(([, color]) => Number(color));
}

describe("theme colors", () => {
  it("learns both directions from YouTube's own color maps", () => {
    const colorPairs = learnedPairs();
    expect([...colorPairs[Theme.LIGHT]]).toEqual([[WHITE, NEAR_BLACK]]);
    expect([...colorPairs[Theme.DARK]]).toEqual([[NEAR_BLACK, WHITE]]);
  });

  it("translates a color baked for the old theme, in both directions", () => {
    const colorPairs = learnedPairs();
    expect(
      fontColorsOf(
        remapBakedColors({
          text: bakedText(WHITE),
          colorPairs,
          theme: Theme.LIGHT
        })
      )
    ).toEqual([NEAR_BLACK]);
    expect(
      fontColorsOf(
        remapBakedColors({
          text: bakedText(NEAR_BLACK),
          colorPairs,
          theme: Theme.DARK
        })
      )
    ).toEqual([WHITE]);
  });

  it("leaves color-mapped runs and unknown colors alone", () => {
    const colorPairs = learnedPairs();
    expect(
      remapBakedColors({
        text: DESCRIPTION,
        colorPairs,
        theme: Theme.LIGHT
      })
    ).toEqual(DESCRIPTION);
    expect(
      fontColorsOf(
        remapBakedColors({
          text: bakedText(UNKNOWN_COLOR),
          colorPairs,
          theme: Theme.LIGHT
        })
      )
    ).toEqual([UNKNOWN_COLOR]);
  });

  it("spots baked colors nested deep in the text, such as a collab byline's collaborators dialog", () => {
    const colorPairs = learnedPairs();
    const byline = attributedTextSchema.parse({
      content: "KSI and 2 more",
      commandRuns: [
        {
          onTap: {
            dialog: {
              items: [{ title: bakedText(WHITE) }]
            }
          }
        }
      ]
    });
    expect(
      hasBakedColor({
        text: byline,
        colorPairs,
        theme: Theme.LIGHT
      })
    ).toBe(true);
    const remapped = remapBakedColors({
      text: byline,
      colorPairs,
      theme: Theme.LIGHT
    });
    expect(fontColorsOf(remapped)).toEqual([NEAR_BLACK]);
    expect(
      hasBakedColor({
        text: remapped,
        colorPairs,
        theme: Theme.LIGHT
      })
    ).toBe(false);
  });
});
