import { readPolymerController } from "@/features/live-theme/page/polymer";
import {
  type ContinuationPlaceholders,
  PANEL_SELECTOR
} from "@/features/live-theme/page/section-refetch/continuation-placeholders";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const PANEL_SECTION_SELECTOR = `${PANEL_SELECTOR} ytd-item-section-renderer`;
const CONTENTS_PATH = "data.contents";
/** The section's own signal that a response's items replaced its placeholder */
const ITEMS_UPDATED_EVENT = "yt-next-continuation-data-updated";
const RESPONSE_TIMEOUT_MS = 10_000;

const isItemSection = createGuard(
  z.looseObject({
    data: z.looseObject({
      targetId: z.string(),
      contents: z.array(z.unknown())
    }),
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

function waitForItems(element: Element) {
  return new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, RESPONSE_TIMEOUT_MS);
    element.addEventListener(
      ITEMS_UPDATED_EVENT,
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
  });
}

/** Every scrolled container around `element` with its offset, so swapping the content can't move the reader */
function readScrollOffsets(element: Element) {
  const offsets: {
    container: Element;
    scrollTop: number;
  }[] = [];
  for (let container = element.parentElement; container; container = container.parentElement) {
    if (container.scrollTop > 0) {
      offsets.push({
        container,
        scrollTop: container.scrollTop
      });
    }
  }
  return offsets;
}

async function refetchSection({ element, placeholders }: { element: Element; placeholders: ContinuationPlaceholders }) {
  const section = readPolymerController(element);
  if (!isItemSection(section)) {
    return;
  }

  const placeholder = placeholders.get(section.data.targetId);
  if (!placeholder) {
    return;
  }

  const scrollOffsets = readScrollOffsets(element);
  const staleCount = section.data.contents.length;
  const itemsArrived = waitForItems(element);
  // Stamped, the placeholder sends its own request; the response replaces it after the stale items
  section.push(CONTENTS_PATH, { continuationItemRenderer: placeholder });
  await itemsArrived;
  section.splice(CONTENTS_PATH, 0, staleCount);
  for (const { container, scrollTop } of scrollOffsets) {
    container.scrollTop = scrollTop;
  }
}

/**
 * The server bakes some content for the theme of the request - a channel's link favicons are white for dark and gray
 * for light - with no other theme's version to translate to. Each open panel section is requested again through its
 * own placeholder, as YouTube loaded it, and the new items replace the old in place
 */
export async function refetchPanelSections(placeholders: ContinuationPlaceholders) {
  await Promise.all(
    [...document.querySelectorAll(PANEL_SECTION_SELECTOR)].map(element =>
      refetchSection({
        element,
        placeholders
      })
    )
  );
}
