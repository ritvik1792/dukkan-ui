/** Stable key so the same upload is not treated as two pictures. */
export function mediaIdentity(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, "https://media.local");
    return decodeURIComponent(parsed.pathname).replace(/\/+$/, "") || trimmed;
  } catch {
    return trimmed;
  }
}

/** Drop blanks, the main picture, and repeated uploads. */
export function uniqueMediaUrls(
  urls: Array<string | undefined | null>,
  exclude?: string | null,
) {
  const skip = exclude ? mediaIdentity(exclude) : "";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    if (!raw) continue;
    const url = raw.trim();
    const key = mediaIdentity(url);
    if (!key || (skip && key === skip) || seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}
