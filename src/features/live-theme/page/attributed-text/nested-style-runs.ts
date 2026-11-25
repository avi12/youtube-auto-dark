import {
  type StyleRun,
  styleRunSchema,
  type TextHostData
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
  value: TextHostData | TextHostData[];
  mapRun: (run: StyleRun) => StyleRun;
}) {
  const copy: unknown = JSON.parse(JSON.stringify(value), (key, child: unknown) => {
    const parsedRuns = key === STYLE_RUNS_KEY ? styleRunsSchema.safeParse(child) : undefined;
    return parsedRuns?.success ? parsedRuns.data.map(mapRun) : child;
  });
  return copy;
}

function pushStyleRuns({ value, runs }: { value: unknown; runs: StyleRun[] }) {
  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const parsedRuns = key === STYLE_RUNS_KEY ? styleRunsSchema.safeParse(child) : undefined;
    if (parsedRuns?.success) {
      runs.push(...parsedRuns.data);
    } else {
      pushStyleRuns({
        value: child,
        runs
      });
    }
  }
}

/** Every style run at any depth, read in place: asking about the runs needs no copy */
export function collectStyleRuns(value: TextHostData | TextHostData[]) {
  const runs: StyleRun[] = [];
  pushStyleRuns({
    value,
    runs
  });
  return runs;
}

/** A copy of `value` with every style run list, at any depth, emptied */
export function stripStyleRuns(value: TextHostData) {
  const copy: unknown = JSON.parse(JSON.stringify(value), (key, child: unknown) =>
    key === STYLE_RUNS_KEY ? [] : child
  );
  return copy;
}
