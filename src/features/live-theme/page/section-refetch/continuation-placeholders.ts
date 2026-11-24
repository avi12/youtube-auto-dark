import { readPolymerController } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const CONTINUATION_SELECTOR = "ytd-continuation-item-renderer";
const ITEM_SECTION_SELECTOR = "ytd-item-section-renderer";
/** Dialogs and side panels: sections whose whole content one request loads, unlike a feed's next page */
export const PANEL_SELECTOR = "ytd-engagement-panel-section-list-renderer";

const continuationItemSchema = z.looseObject({ continuationEndpoint: z.looseObject({}) });
const isContinuationController = createGuard(z.looseObject({ data: continuationItemSchema }));

const isTargetedSection = createGuard(
  z.looseObject({
    data: z.looseObject({ targetId: z.string() })
  })
);

/**
 * A panel section loads its content through a placeholder (`continuationItemRenderer`) that YouTube's own response
 * replaces, after which nothing on the page keeps the request. Each placeholder is remembered by its section's
 * `targetId` as YouTube stamps it, so the section's content can be requested again
 */
export function createContinuationPlaceholders() {
  const placeholders = new Map<string, z.infer<typeof continuationItemSchema>>();

  function remember(element: Element) {
    const isInPanel = element.closest(PANEL_SELECTOR) !== null;
    const sectionElement = element.closest(ITEM_SECTION_SELECTOR);
    if (!isInPanel || !sectionElement) {
      return;
    }

    const controller = readPolymerController(element);
    if (!isContinuationController(controller)) {
      return;
    }

    const section = readPolymerController(sectionElement);
    if (!isTargetedSection(section)) {
      return;
    }

    placeholders.set(section.data.targetId, controller.data);
  }

  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        if (node.matches(CONTINUATION_SELECTOR)) {
          remember(node);
        }

        for (const element of node.querySelectorAll(CONTINUATION_SELECTOR)) {
          remember(element);
        }
      }
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  return placeholders;
}

export type ContinuationPlaceholders = ReturnType<typeof createContinuationPlaceholders>;
