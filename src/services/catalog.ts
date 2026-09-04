import { distanceKm } from "@/lib/geo";
import type {
  CatalogProduct,
  Coordinates,
  Coupon,
  Listing,
  NearbyShop,
  Shop,
} from "@/lib/types";
import { cheapestLanded } from "./pricing";

export function shopsInRadius(
  shops: Shop[],
  origin: Coordinates,
  radiusKm: number,
): NearbyShop[] {
  return shops
    .map((shop) => ({
      ...shop,
      distanceKm: distanceKm(origin, shop.coordinates),
    }))
    .filter((shop) => shop.status === "active" && shop.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export type UniqueOffer = {
  product: CatalogProduct;
  listings: Listing[];
  nearbyListings: Listing[];
  fromPrice: number;
  sellerCount: number;
  bestListing: Listing | null;
};

export function uniqueCatalogOffers(params: {
  catalog: CatalogProduct[];
  listings: Listing[];
  nearbyShopIds: Set<string>;
  shops: Shop[];
  query?: string;
  categoryId?: string;
}): UniqueOffer[] {
  const q = (params.query ?? "").trim().toLowerCase();
  const shopById = new Map(params.shops.map((s) => [s.id, s]));

  return params.catalog
    .filter((product) => {
      if (params.categoryId && product.categoryId !== params.categoryId) return false;
      if (!q) return true;
      return `${product.name} ${product.brand} ${product.categoryId}`
        .toLowerCase()
        .includes(q);
    })
    .map((product) => {
      const all = params.listings.filter(
        (l) => l.catalogProductId === product.id && l.status === "approved",
      );
      const nearbyListings = all.filter((l) => params.nearbyShopIds.has(l.shopId));
      const ranked = [...nearbyListings].sort((a, b) => {
        const shopA = shopById.get(a.shopId);
        const shopB = shopById.get(b.shopId);
        if (!shopA || !shopB) return a.sellerPrice - b.sellerPrice;
        const ca = cheapestLanded(a, shopA)?.total ?? Infinity;
        const cb = cheapestLanded(b, shopB)?.total ?? Infinity;
        return ca - cb;
      });
      const best = ranked[0] ?? null;
      return {
        product,
        listings: all,
        nearbyListings,
        fromPrice: best?.sellerPrice ?? 0,
        sellerCount: nearbyListings.length,
        bestListing: best,
      };
    })
    .filter((offer) => offer.sellerCount > 0);
}

export function findCatalogByName(
  catalog: CatalogProduct[],
  name: string,
  brand: string,
) {
  const key = `${name}|${brand}`.toLowerCase().trim();
  return catalog.find((p) => `${p.name}|${p.brand}`.toLowerCase().trim() === key);
}

export function shopPromoLines(
  shop: Shop,
  listings: Listing[],
  coupons: Coupon[],
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  function push(line: string) {
    const key = line.toLowerCase();
    if (!line || seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  }

  for (const coupon of coupons) {
    if (coupon.shopId !== shop.id || !coupon.active) continue;
    push(coupon.label);
  }

  for (const listing of listings) {
    if (listing.shopId !== shop.id || listing.status !== "approved") continue;
    for (const tag of listing.tags) {
      if (tag.kind === "badge") continue;
      if (tag.discountPercent) push(`${tag.discountPercent}% off · ${tag.label}`);
      else push(tag.label);
    }
  }

  if (shop.partnerDeliveryEnabled) push("Partner delivery nearby");
  else if (shop.shopDeliveryEnabled) push("Shop delivery available");

  return lines;
}
