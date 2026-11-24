import { z } from "@/lib/zod";

/** The theme keys of a style run's `styleRunColorMapExtension.colorMap` */
export enum InterfaceTheme {
  DARK = "USER_INTERFACE_THEME_DARK",
  LIGHT = "USER_INTERFACE_THEME_LIGHT"
}

const MAX_ARGB_COLOR = 0xff_ff_ff_ff;
/** InnerTube's colors: 32-bit ARGB integers (`0xffffffff` is opaque white) */
const argbColorSchema = z.number().int().nonnegative().max(MAX_ARGB_COLOR).brand("ArgbColor");
export type ArgbColor = z.infer<typeof argbColorSchema>;

const colorMapEntrySchema = z.object({
  key: z.enum(InterfaceTheme),
  value: argbColorSchema
});

export const styleRunSchema = z.looseObject({
  fontColor: argbColorSchema.optional(),
  styleRunExtensions: z
    .looseObject({
      styleRunColorMapExtension: z.looseObject({ colorMap: z.array(colorMapEntrySchema) }).optional()
    })
    .optional()
});
export type StyleRun = z.infer<typeof styleRunSchema>;

/**
 * What a text-rendering component's `data` holds: an AttributedString (`yt-attributed-string`) or a whole view model
 * whose attributed strings sit at any depth (`yt-page-header-renderer`); unknown fields pass through untouched
 */
export const textHostDataSchema = z.looseObject({});
export type TextHostData = z.infer<typeof textHostDataSchema>;

/** InnerTube's AttributedString, as `yt-attributed-string` receives it; unknown fields pass through untouched */
export const attributedTextSchema = z.looseObject({
  content: z.string(),
  styleRuns: z.array(styleRunSchema).optional()
});
