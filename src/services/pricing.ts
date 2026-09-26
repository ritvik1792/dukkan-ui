import type { DeliveryMode, Listing, Shop } from "@/lib/types";

export function shopDeliveryModes(shop: Shop, quickDeliveryEnabled = false): DeliveryMode[] {
  const modes: DeliveryMode[] = [];
  if (quickDeliveryEnabled && shop.partnerDeliveryEnabled) modes.push("partner");
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
  quickDeliveryEnabled = false,
): { mode: DeliveryMode; fee: number; total: number } | null {
  const modes = shopDeliveryModes(shop, quickDeliveryEnabled);
  if (modes.length === 0) return null;
  return modes
    .map((mode) => ({
      mode,
      fee: deliveryFeeFor(shop, mode),
      total: landedCost(listing, shop, mode),
    }))
    .sort((a, b) => a.total - b.total)[0];
}
