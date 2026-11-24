import { describe, expect, it } from "vitest";

import { parsePrefValue } from "@/features/live-theme/prefs/pref-cookie";

describe("parsePrefValue", () => {
  it("reads YouTube's key=value&key=value format", () => {
    expect(Object.fromEntries(parsePrefValue("f6=40000400&tz=Asia.Jerusalem"))).toEqual({
      f6: "40000400",
      tz: "Asia.Jerusalem"
    });
  });

  it("decodes before splitting and skips empty values", () => {
    expect([...parsePrefValue("f6%3D400%26hl%3D")]).toEqual([["f6", "400"]]);
  });
});
