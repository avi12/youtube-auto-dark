import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const isPolymerHost = createGuard(z.looseObject({ polymerController: z.looseObject({}) }));

/** The component instance YouTube's Polymer elements keep their properties on */
export function readPolymerController(element: Element) {
  return isPolymerHost(element) ? element.polymerController : undefined;
}

/** The Polymer controller of the first element matching `selector` */
export function readControllerOf(selector: string) {
  const element = document.querySelector(selector);
  return element ? readPolymerController(element) : undefined;
}
