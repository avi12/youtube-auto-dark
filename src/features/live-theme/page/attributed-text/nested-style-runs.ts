import {
  type AttributedText,
  type StyleRun,
  styleRunSchema
} from "@/features/live-theme/page/attributed-text/attributed-text-schema";
import { z } from "@/lib/zod";

/**
 * Attributed text nests more attributed text: a collab byline carries its whole collaborators dialog in its tap command,
 * each name an AttributedString of its own. Style runs are found by key wherever they sit - InnerTube data is plain
 * JSON, so a JSON round trip's reviver visits every level
 */
const STYLE_RUNS_KEY = "styleRuns";
const styleRunsSchema = z.array(styleRunSchema);

/** A copy of `value` with every style run, at any depth, passed through `mapRun` */
export function mapStyleRuns({
  value,
  mapRun
}: {
  value: AttributedText | AttributedText[];
  mapRun: (run: StyleRun) => StyleRun;
}) {
  const copy: unknown = JSON.parse(JSON.stringify(value), (key, child: unknown) => {
    const parsedRuns = key === STYLE_RUNS_KEY ? styleRunsSchema.safeParse(child) : undefined;
    return parsedRuns?.success ? parsedRuns.data.map(mapRun) : child;
  });
  return copy;
}

export function collectStyleRuns(value: AttributedText | AttributedText[]) {
  const runs: StyleRun[] = [];
  mapStyleRuns({
    value,
    mapRun(run) {
      runs.push(run);
      return run;
    }
  });
  return runs;
}
