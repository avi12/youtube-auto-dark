/** Fired on the container once YouTube's response filled it: items appended, or a slot (a grid's header) reloaded */
const RESPONSE_APPLIED_EVENTS = ["yt-next-continuation-data-updated", "yt-reload-continuation-finish"];

/** Resolves when YouTube's next response has been applied to `elContainer` */
export function waitForResponse(elContainer: Element) {
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
