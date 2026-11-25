import { z } from "@/lib/zod";

/** The PREF cookie bits YouTube's app reads to pick a theme (`getFlag` in its base module) */
export enum PrefFlag {
  DARK_THEME = 165,
  LIGHT_THEME = 174
}

/** A flag group's PREF key, `f1`, `f2`, ... */
type FlagGroupKey = `f${number}`;
/** Parsed PREF entries; flag groups sit beside other keys such as `hl` */
export type PrefEntries = ReadonlyMap<string, string>;

const FLAGS_PER_GROUP = 31;
const HEX_RADIX = 16;
/** A flag group: hex digits, read as a number, and 0 - no flag set - when absent or malformed */
const flagGroupSchema = z
  .string()
  .regex(/^[\dA-Fa-f]+$/)
  .transform(hex => Number.parseInt(hex, HEX_RADIX))
  .catch(0);

/** Each `fN` entry holds 31 flags as hex, flag `n` at bit `n % 31` of group `floor(n / 31) + 1` */
export function readPrefFlag({ entries, flag }: { entries: PrefEntries; flag: PrefFlag }) {
  const groupKey: FlagGroupKey = `f${Math.floor(flag / FLAGS_PER_GROUP) + 1}`;
  const group = flagGroupSchema.parse(entries.get(groupKey));
  return (group & (1 << (flag % FLAGS_PER_GROUP))) !== 0;
}
