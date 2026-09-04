import type { CatalogProduct, Listing, Review, Shop } from "@/lib/types";
import { uniqueCatalogOffers, type UniqueOffer } from "./catalog";

export type StorefrontDb = {
  shops: Shop[];
  catalog: CatalogProduct[];
  listings: Listing[];
  reviews: Review[];
};

/** Replace with GET /api/shops/:id when the backend exists. */
export async function fetchShop(shopId: string, db: StorefrontDb): Promise<Shop | null> {
  return db.shops.find((shop) => shop.id === shopId) ?? null;
}

export async function fetchShopCatalog(
  shopId: string,
  db: StorefrontDb,
  filters?: { query?: string; categoryId?: string },
): Promise<UniqueOffer[]> {
  return uniqueCatalogOffers({
    catalog: db.catalog,
    listings: db.listings.filter((listing) => listing.shopId === shopId),
    nearbyShopIds: new Set([shopId]),
    shops: db.shops,
    query: filters?.query,
    categoryId: filters?.categoryId,
  });
}

export type ProductInfo = {
  product: CatalogProduct;
  listings: Listing[];
  reviews: Review[];
};

/** Replace with GET /api/products/:id when the backend exists. */
export async function fetchProduct(productId: string, db: StorefrontDb): Promise<ProductInfo | null> {
  const product = db.catalog.find((item) => item.id === productId);
  if (!product) return null;
  return {
    product,
    listings: db.listings.filter(
      (listing) => listing.catalogProductId === productId && listing.status === "approved",
    ),
    reviews: db.reviews.filter((review) => review.catalogProductId === productId),
  };
}
