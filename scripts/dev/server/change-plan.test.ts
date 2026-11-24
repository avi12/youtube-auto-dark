import { describe, expect, it } from "vitest";

import { ChangeKind, planChange } from "#dev/server/change-plan";

describe("planChange", () => {
  it("treats config, lockfile and env edits as config changes", () => {
    expect(planChange(["src/lib/zod.ts", "wxt.config.ts"])).toBe(ChangeKind.CONFIG);
    expect(planChange([".env.local"])).toBe(ChangeKind.CONFIG);
  });

  it("reloads for anything the background or content script imports", () => {
    expect(planChange(["src/lib/theme/theme.ts"])).toBe(ChangeKind.SOURCE);
  });
});
