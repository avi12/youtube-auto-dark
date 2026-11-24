import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

const isPolymerHost = createGuard(z.looseObject({ polymerController: z.looseObject({}) }));

/** The component instance YouTube's Polymer elements keep their properties on */
export function readPolymerController(elHost: Element) {
  return isPolymerHost(elHost) ? elHost.polymerController : undefined;
}

/** The Polymer controller of the first element matching `selector` */
export function readControllerOf(selector: string) {
  const elMatch = document.querySelector(selector);
  return elMatch ? readPolymerController(elMatch) : undefined;
}
