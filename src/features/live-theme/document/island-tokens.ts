import { isCssGroupingRule, isCssStyleRule } from "@/lib/dom-guards";
import { Theme } from "@/lib/theme/theme";

const CUSTOM_PROPERTY_PREFIX = "--";

/** YouTube's token islands, which its page stylesheet ships for both themes */
function islandSelectorOf(theme: Theme) {
  return theme === Theme.DARK ? "[dark]" : "[light]";
}

/** A cross-origin stylesheet (the player's, an ad's) refuses reads; it holds no island either */
function readRules(sheet: CSSStyleSheet) {
  try {
    return [...sheet.cssRules];
  } catch {
    return [];
  }
}

function collectIslandTokens({
  rules,
  selector,
  tokens
}: {
  rules: CSSRule[];
  selector: string;
  tokens: Map<string, string>;
}) {
  for (const rule of rules) {
    // Not exclusive: where CSS nesting makes every style rule a grouping rule too (Firefox), it is read as both
    if (isCssGroupingRule(rule)) {
      collectIslandTokens({
        rules: [...rule.cssRules],
        selector,
        tokens
      });
    }

    const isIsland = isCssStyleRule(rule) && rule.selectorText.trim() === selector;
    if (!isIsland) {
      continue;
    }

    for (const name of rule.style) {
      if (name.startsWith(CUSTOM_PROPERTY_PREFIX)) {
        tokens.set(name, rule.style.getPropertyValue(name).trim());
      }
    }
  }
}

/** Reads, never writes: the `--t…` token values YouTube's own page stylesheet declares for `theme` */
export function readIslandTokens(theme: Theme) {
  const tokens = new Map<string, string>();
  for (const sheet of document.styleSheets) {
    collectIslandTokens({
      rules: readRules(sheet),
      selector: islandSelectorOf(theme),
      tokens
    });
  }
  return Object.fromEntries(tokens);
}
