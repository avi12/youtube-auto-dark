/** Hover colors (a video card's tint and the text colors on it) are computed when the pointer enters, for that theme */
const LEAVE_EVENTS = ["pointerout", "mouseout", "pointerleave", "mouseleave"];
const ENTER_EVENTS = ["pointerover", "mouseover", "pointerenter", "mouseenter"];

function fire({ elTarget, type }: { elTarget: Element; type: string }) {
  // Enter and leave events don't bubble, as the real ones don't
  const isBubbling = !type.endsWith("enter") && !type.endsWith("leave");
  elTarget.dispatchEvent(
    new MouseEvent(type, {
      bubbles: isBubbling,
      composed: true,
      relatedTarget: document.documentElement
    })
  );
}

/**
 * The pointer rests where it was when the theme flips, so whatever it hovers keeps the colors YouTube computed for the
 * old theme until it leaves. The hovered chain leaves and enters again, which has YouTube compute them anew
 */
export function replayHover() {
  const hoveredElements = [...document.querySelectorAll(":hover")].reverse();
  for (const elTarget of hoveredElements) {
    for (const type of LEAVE_EVENTS) {
      fire({
        elTarget,
        type
      });
    }
  }

  for (const elTarget of hoveredElements.toReversed()) {
    for (const type of ENTER_EVENTS) {
      fire({
        elTarget,
        type
      });
    }
  }
}
