import type { DeliveryMode, Listing, Shop } from "@/lib/types";

export function shopDeliveryModes(shop: Shop): DeliveryMode[] {
  const modes: DeliveryMode[] = [];
  if (shop.partnerDeliveryEnabled) modes.push("partner");
  if (shop.shopDeliveryEnabled) modes.push("shop");
  return modes;
}

export function deliveryFeeFor(shop: Shop, mode: DeliveryMode) {
  return mode === "partner" ? shop.partnerDeliveryFee : shop.shopDeliveryFee;
}

export function landedCost(listing: Listing, shop: Shop, mode: DeliveryMode) {
  return listing.sellerPrice + deliveryFeeFor(shop, mode);
}

export function cheapestLanded(
  listing: Listing,
  shop: Shop,
): { mode: DeliveryMode; fee: number; total: number } | null {
  const modes = shopDeliveryModes(shop);
  if (modes.length === 0) return null;
  return modes
    .map((mode) => ({
      mode,
      fee: deliveryFeeFor(shop, mode),
      total: landedCost(listing, shop, mode),
    }))
    .sort((a, b) => a.total - b.total)[0];
}
