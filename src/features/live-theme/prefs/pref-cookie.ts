const PREF_COOKIE_PREFIX = "PREF=";
const COOKIE_SEPARATOR = "; ";
const ENTRY_SEPARATOR = "&";
const KEY_VALUE_SEPARATOR = "=";

/** YouTube's PREF `parse`: the whole value is URI-decoded, then split into `key=value` pairs, empty values skipped */
export function parsePrefValue(value: string) {
  const entries = new Map<string, string>();
  for (const pair of decodeURIComponent(value).split(ENTRY_SEPARATOR)) {
    const [key, entryValue] = pair.split(KEY_VALUE_SEPARATOR);
    if (key && entryValue) {
      entries.set(key, entryValue);
    }
  }
  return entries;
}

export function readPrefEntries() {
  const prefCookie = document.cookie.split(COOKIE_SEPARATOR).find(cookie => cookie.startsWith(PREF_COOKIE_PREFIX));
  return parsePrefValue(prefCookie?.slice(PREF_COOKIE_PREFIX.length) ?? "");
}
