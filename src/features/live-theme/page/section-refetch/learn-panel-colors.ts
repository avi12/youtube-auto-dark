import { InterfaceTheme, textHostDataSchema } from "@/features/live-theme/page/attributed-text/attributed-text-schema";
import { learnBakedColorPairs, type ThemeColorPairs } from "@/features/live-theme/page/attributed-text/theme-colors";
import type { PlaceholderTarget } from "@/features/live-theme/page/section-refetch/continuation-placeholders";
import { waitForResponse } from "@/features/live-theme/page/section-refetch/response-events";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const INNERTUBE_CONTEXT_KEY = "INNERTUBE_CONTEXT";
const isYoutubeConfigHost = createGuard(
  z.looseObject({
    ytcfg: z.looseObject({
      get: z.function({
        input: [z.literal(INNERTUBE_CONTEXT_KEY)],
        output: z.unknown()
      })
    })
  })
);
const requestContextSchema = z.looseObject({ client: z.looseObject({}) });
const continuationRequestSchema = z.looseObject({
  continuationEndpoint: z.looseObject({
    continuationCommand: z.looseObject({ token: z.string() }),
    commandMetadata: z.looseObject({ webCommandMetadata: z.looseObject({ apiUrl: z.string() }) })
  })
});

/** The response to the placeholder's own request, as YouTube's would be for a page showing `theme` */
async function requestContent({ target, theme }: { target: PlaceholderTarget; theme: InterfaceTheme }) {
  const request = continuationRequestSchema.parse(target.placeholder);
  if (!isYoutubeConfigHost(window)) {
    throw new TypeError("YouTube's page configuration is missing");
  }

  const { client, ...context } = requestContextSchema.parse(window.ytcfg.get(INNERTUBE_CONTEXT_KEY));
  const { token } = request.continuationEndpoint.continuationCommand;
  const response = await fetch(request.continuationEndpoint.commandMetadata.webCommandMetadata.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      context: {
        ...context,
        client: {
          ...client,
          userInterfaceTheme: theme
        }
      },
      continuation: token
    })
  });
  return textHostDataSchema.parse(await response.json());
}

/**
 * The server's theme-baked colors (a sound page's byline gray) have no color map to translate by, and re-fetching the
 * panel on a switch leaves them wrong until the response arrives. The request carries the theme it is for
 * (`userInterfaceTheme`), so once a panel's content has loaded it is requested for both themes, and every color that
 * differs between the two joins the pairs the text step translates by - the switch then needs no wait
 */
export async function learnPanelColors({
  target,
  colorPairs
}: {
  target: PlaceholderTarget;
  colorPairs: ThemeColorPairs;
}) {
  await waitForResponse(target.elContainer);
  const [darkText, lightText] = await Promise.all([
    requestContent({
      target,
      theme: InterfaceTheme.DARK
    }),
    requestContent({
      target,
      theme: InterfaceTheme.LIGHT
    })
  ]);
  learnBakedColorPairs({
    darkText,
    lightText,
    colorPairs
  });
}
