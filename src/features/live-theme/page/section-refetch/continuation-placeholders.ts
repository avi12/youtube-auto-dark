import { readPolymerController } from "@/features/live-theme/page/polymer";
import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const CONTINUATION_SELECTOR = "ytd-continuation-item-renderer";
/** Dialogs and side panels: content one request loads, unlike a feed's next page */
const PANEL_SELECTOR = "ytd-engagement-panel-section-list-renderer";

const continuationItemSchema = z.looseObject({ continuationEndpoint: z.looseObject({}) });
const isContinuationController = createGuard(z.looseObject({ data: continuationItemSchema }));

const isTargetedContainer = createGuard(z.looseObject({ data: z.looseObject({ targetId: z.string() }) }));

export type ContinuationPlaceholder = z.infer<typeof continuationItemSchema>;

/** The component a response's items land in, named by the `targetId` YouTube's response carries */
export interface PlaceholderTarget {
  placeholder: ContinuationPlaceholder;
  container: Element;
}

/** The nearest component inside the panel that a continuation response can be addressed to */
function findContainer(placeholderElement: Element) {
  const panel = placeholderElement.closest(PANEL_SELECTOR);
  for (let element = placeholderElement.parentElement; element && element !== panel; element = element.parentElement) {
    if (isTargetedContainer(readPolymerController(element))) {
      return element;
    }
  }
  return undefined;
}

/**
 * Panel content loads through a placeholder (`continuationItemRenderer`) that YouTube's own response replaces, after
 * which nothing on the page keeps the request. Each placeholder is remembered as YouTube stamps it, against its
 * container's `targetId`, so the content can be requested again. The first one stays: it is the content's own
 * request, where a later one on the same container only asks for the next page
 */
export function createContinuationPlaceholders() {
  const placeholders = new Map<string, PlaceholderTarget>();

  function remember(element: Element) {
    const container = findContainer(element);
    if (!container) {
      return;
    }

    const controller = readPolymerController(element);
    if (!isContinuationController(controller)) {
      return;
    }

    const containerController = readPolymerController(container);
    if (!isTargetedContainer(containerController)) {
      return;
    }

    const { targetId } = containerController.data;
    if (!placeholders.has(targetId)) {
      placeholders.set(targetId, {
        placeholder: controller.data,
        container
      });
    }
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
