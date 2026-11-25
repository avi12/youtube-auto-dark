import { Theme } from "@/lib/theme/theme";
import { z } from "@/lib/zod";

/** A switch the isolated script has written to the DOM, for the page script to carry into YouTube's components */
export const themeChangeSchema = z.object({
  theme: z.enum(Theme),
  /** Whether this is the theme the server rendered the page in, whose late content needs no repair */
  isServerTheme: z.boolean(),
  /** The `--t…` values the page stylesheet declares for the theme, read only while a live chat is open */
  chatTokens: z.record(z.string(), z.string()).optional()
});

export type ThemeChange = z.infer<typeof themeChangeSchema>;
