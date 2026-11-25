import { z } from "@/lib/zod";
import { createLazyGuard } from "@/lib/zod-guard";

/** Type guards for the DOM classes the extension tells apart, in the same zod form as the page-object guards */
export const isElement = createLazyGuard(() => z.instanceof(Element));
export const isIframeElement = createLazyGuard(() => z.instanceof(HTMLIFrameElement));
export const isCssGroupingRule = createLazyGuard(() => z.instanceof(CSSGroupingRule));
export const isCssStyleRule = createLazyGuard(() => z.instanceof(CSSStyleRule));
