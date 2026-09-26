/** Same name ranking the search API uses: exact and leading names beat a stray mention. */

const MIN_SCORE = 12;

export function nameRelevance(
  query: string,
  fields: { value?: string; weight: number }[],
): number {
  const needle = normalize(query);
  if (!needle) return 0;
  let best = 0;
  let sum = 0;
  for (const field of fields) {
    if (!field || field.weight <= 0 || !field.value?.trim()) continue;
    const weighted = fieldScore(needle, normalize(field.value)) * field.weight;
    best = Math.max(best, weighted);
    sum += weighted;
  }
  if (best <= 0) return 0;
  return best + (sum - best) * 0.08;
}

export function isNameMatch(score: number) {
  return score >= MIN_SCORE;
}

function fieldScore(needle: string, value: string) {
  if (!needle || !value) return 0;
  if (value === needle) return 100;
  if (value.startsWith(needle)) return 86;
  const words = value.split(" ").filter(Boolean);
  if (words.includes(needle)) return 74;
  if (value.includes(needle)) return 58;
  const tokens = needle.split(" ").filter((token) => token.length >= 2);
  if (tokens.length === 0) return 0;
  let total = 0;
  let matched = 0;
  for (const token of tokens) {
    if (words.includes(token)) {
      total += 30;
      matched++;
    } else if (words.some((word) => word.startsWith(token))) {
      total += 20;
      matched++;
    } else if (value.includes(token)) {
      total += 8;
      matched++;
    }
  }
  if (tokens.length > 1 && matched === tokens.length) total += 18;
  return total;
}

function normalize(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
