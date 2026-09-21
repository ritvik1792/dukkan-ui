import type { AdPlacement, Advertisement } from "@/lib/types";

const DEFAULT_ROTATION_SECONDS = 5.5;

/**
 * Ads that should actually rotate in a slot: active, inside their schedule, ordered by weight,
 * and capped at the slot's `maxAds`.
 */
export function adsForPlacement(
  ads: Advertisement[],
  placement: AdPlacement | undefined,
  now = new Date(),
) {
  if (placement && !placement.active) return [];
  const stamp = now.toISOString();
  const booked = ads.filter((ad) => {
    if (!ad.active) return false;
    if (placement && ad.placementId !== placement.id) return false;
    if (ad.startsAt && ad.startsAt > stamp) return false;
    if (ad.endsAt && ad.endsAt < stamp) return false;
    return true;
  });
  const ordered = [...booked].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
  return placement ? ordered.slice(0, placement.maxAds) : ordered;
}

export function placementBySlug(placements: AdPlacement[], slug: string) {
  return placements.find((placement) => placement.slug === slug);
}

export function rotationMs(placement?: AdPlacement) {
  return (placement?.rotationSeconds ?? DEFAULT_ROTATION_SECONDS) * 1000;
}
