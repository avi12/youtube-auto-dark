import { readPolymerController } from "@/features/live-theme/page/polymer";
import {
  type ContinuationPlaceholders,
  type PlaceholderTarget
} from "@/features/live-theme/page/section-refetch/continuation-placeholders";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const CONTENTS_PATH = "data.contents";
/** Fired on the container once YouTube's response filled it: items appended, or a slot (a grid's header) reloaded */
const RESPONSE_APPLIED_EVENTS = ["yt-next-continuation-data-updated", "yt-reload-continuation-finish"];

const isPlaceholderContainer = createGuard(
  z.looseObject({
    data: z.looseObject({ contents: z.array(z.unknown()) }),
    push: z.function({
      input: [z.string(), z.unknown()],
      output: z.unknown()
    }),
    splice: z.function({
      input: [z.string(), z.number(), z.number()],
      output: z.unknown()
    })
  })
);

function waitForResponse(elContainer: Element) {
  return new Promise<void>(resolve => {
    const listeners = new AbortController();
    for (const eventName of RESPONSE_APPLIED_EVENTS) {
      elContainer.addEventListener(
        eventName,
        () => {
          listeners.abort();
          resolve();
        },
        { signal: listeners.signal }
      );
    }
  });
}

/** Every scrolled container around `elTarget` with its offset, so swapping the content can't move the reader */
function readScrollOffsets(elTarget: Element) {
  const offsets: {
    elContainer: Element;
    scrollTop: number;
  }[] = [];
  for (let elContainer = elTarget.parentElement; elContainer; elContainer = elContainer.parentElement) {
    if (elContainer.scrollTop > 0) {
      offsets.push({
        elContainer,
        scrollTop: elContainer.scrollTop
      });
    }
  }
  return offsets;
}

async function refetchContainer({ placeholder, elContainer }: PlaceholderTarget) {
  if (!elContainer.isConnected) {
    return;
  }

  const section = readPolymerController(elContainer);
  if (!isPlaceholderContainer(section)) {
    return;
  }

  const scrollOffsets = readScrollOffsets(elContainer);
  const staleItems = [...section.data.contents];
  const placeholderItem = { continuationItemRenderer: placeholder };
  const responseApplied = waitForResponse(elContainer);
  // Stamped, the placeholder sends its own request, whatever slot the response then fills
  section.push(CONTENTS_PATH, placeholderItem);
  await responseApplied;

  const placeholderIndex = section.data.contents.indexOf(placeholderItem);
  const isPlaceholderKept = placeholderIndex >= 0;
  if (isPlaceholderKept) {
    // The response filled another slot (a grid's header), so the items it left are still current
    section.splice(CONTENTS_PATH, placeholderIndex, 1);
  }

  const hasStaleItemsKept = staleItems.length > 0 && section.data.contents[0] === staleItems[0];
  if (!isPlaceholderKept && hasStaleItemsKept) {
    // The response's items replaced the placeholder, after the stale ones
    section.splice(CONTENTS_PATH, 0, staleItems.length);
  }

  for (const { elContainer: elScroller, scrollTop } of scrollOffsets) {
    elScroller.scrollTop = scrollTop;
  }
}

/**
 * The server bakes some content for the theme of the request - a channel's link favicons are white for dark and gray
 * for light, a sound page's byline gray is the light theme's - with no other theme's version to translate to. Each
 * panel's content is requested again through its own placeholder, as YouTube loaded it, and the new content replaces
 * the old in place
 */
export async function refetchPanelSections(placeholders: ContinuationPlaceholders) {
  await Promise.all([...placeholders.values()].map(refetchContainer));
}
