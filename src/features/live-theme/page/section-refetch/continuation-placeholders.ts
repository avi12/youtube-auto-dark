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
  elContainer: Element;
}

/** The nearest component inside the panel that a continuation response can be addressed to */
function findContainer(elPlaceholder: Element) {
  const panel = elPlaceholder.closest(PANEL_SELECTOR);
  if (!panel) {
    // A feed's own pages (a channel's Posts tab) are not panel content: re-requesting them replaces what the reader sees
    return undefined;
  }

  for (
    let elAncestor = elPlaceholder.parentElement;
    elAncestor && elAncestor !== panel;
    elAncestor = elAncestor.parentElement
  ) {
    if (isTargetedContainer(readPolymerController(elAncestor))) {
      return elAncestor;
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
export function createContinuationPlaceholders({ onRemember }: { onRemember: (target: PlaceholderTarget) => void }) {
  const placeholders = new Map<string, PlaceholderTarget>();

  function remember(elPlaceholder: Element) {
    const elContainer = findContainer(elPlaceholder);
    if (!elContainer) {
      return;
    }

    const controller = readPolymerController(elPlaceholder);
    if (!isContinuationController(controller)) {
      return;
    }

    const containerController = readPolymerController(elContainer);
    if (!isTargetedContainer(containerController)) {
      return;
    }

    const { targetId } = containerController.data;
    if (!placeholders.has(targetId)) {
      const target = {
        placeholder: controller.data,
        elContainer
      };
      placeholders.set(targetId, target);
      onRemember(target);
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

        for (const elPlaceholder of node.querySelectorAll(CONTINUATION_SELECTOR)) {
          remember(elPlaceholder);
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
