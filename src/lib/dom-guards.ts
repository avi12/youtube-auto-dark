import { z } from "@/lib/zod";
import { createGuard } from "@/lib/zod-guard";

/** Type guards for the DOM classes the extension tells apart, in the same zod form as the page-object guards */
export const isElement = createGuard(z.instanceof(Element));
export const isIframeElement = createGuard(z.instanceof(HTMLIFrameElement));
export const isCssGroupingRule = createGuard(z.instanceof(CSSGroupingRule));
export const isCssStyleRule = createGuard(z.instanceof(CSSStyleRule));
