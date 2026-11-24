import { describe, expect, it } from "vitest";

import { PrefFlag, readPrefFlag } from "@/features/live-theme/prefs/pref-flags";

describe("readPrefFlag", () => {
  it("reads YouTube's dark choice as f6 bit 0x400 and light as 0x80000", () => {
    const entries = new Map([["f6", "80400"]]);
    expect(
      readPrefFlag({
        entries,
        flag: PrefFlag.DARK_THEME
      })
    ).toBe(true);
    expect(
      readPrefFlag({
        entries,
        flag: PrefFlag.LIGHT_THEME
      })
    ).toBe(true);
  });

  it("ignores the recorded device theme bit 0x40000000", () => {
    expect(
      readPrefFlag({
        entries: new Map([["f6", "40000000"]]),
        flag: PrefFlag.DARK_THEME
      })
    ).toBe(false);
  });

  it("treats a malformed group as empty", () => {
    expect(
      readPrefFlag({
        entries: new Map([["f6", "zz"]]),
        flag: PrefFlag.DARK_THEME
      })
    ).toBe(false);
  });
});
