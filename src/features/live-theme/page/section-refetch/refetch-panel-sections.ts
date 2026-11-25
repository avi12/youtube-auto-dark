import { readPolymerController } from "@/features/live-theme/page/polymer";
import {
  continuationItemSchema,
  type ContinuationPlaceholders,
  type PlaceholderTarget
} from "@/features/live-theme/page/section-refetch/continuation-placeholders";
import { waitForResponse } from "@/features/live-theme/page/section-refetch/response-events";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const CONTENTS_PATH = "data.contents";
/** Marks the placeholder this step pushed, so it is found again however YouTube copies the items: no page code can read or collide with a symbol key, and it never reaches a request body */
const REFETCH_STAMP = Symbol("youtube-auto-dark.refetch");
const placeholderItemSchema = z.looseObject({ continuationItemRenderer: continuationItemSchema });
const pendingRefetches = new WeakMap<Element, Promise<void>>();
const isPlaceholderContainer = createGuard(
  z.looseObject({
    data: z.looseObject({ contents: z.array(z.unknown()) }),
    unshift: z.function({
      input: [z.literal(CONTENTS_PATH), placeholderItemSchema],
      output: z.unknown()
    }),
    splice: z.function({
      input: [z.literal(CONTENTS_PATH), z.number(), z.number()],
      output: z.unknown()
    })
  })
);

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

function isStamped(item: unknown) {
  return typeof item === "object" && item !== null && REFETCH_STAMP in item;
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
  const placeholderItem = {
    continuationItemRenderer: placeholder,
    [REFETCH_STAMP]: true
  };
  const responseApplied = waitForResponse(elContainer);
  // Stamped, the placeholder sends its own request, whatever slot the response then fills. It goes first: a placeholder
  // sends it when shown, which one at the end of a long grid is not until the reader scrolls there
  section.unshift(CONTENTS_PATH, placeholderItem);
  await responseApplied;

  const placeholderIndex = section.data.contents.findIndex(isStamped);
  const isPlaceholderKept = placeholderIndex >= 0;
  if (isPlaceholderKept) {
    // The response filled another slot (a grid's header), so the items it left are still current
    section.splice(CONTENTS_PATH, placeholderIndex, 1);
  }

  const staleIndex = staleItems.length > 0 ? section.data.contents.indexOf(staleItems[0]) : -1;
  const hasStaleItemsKept = staleIndex >= 0;
  if (!isPlaceholderKept && hasStaleItemsKept) {
    // The response's items replaced the placeholder, ahead of the stale ones
    section.splice(CONTENTS_PATH, staleIndex, staleItems.length);
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
  await Promise.all(
    [...placeholders.values()].map(target => {
      // Two re-fetches at once on one container would each splice around the other's items, leaving the content twice
      const previous = pendingRefetches.get(target.elContainer) ?? Promise.resolve();
      const next = previous.then(() => refetchContainer(target));
      pendingRefetches.set(target.elContainer, next);
      return next;
    })
  );
}
