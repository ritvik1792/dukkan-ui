import {
  apiFetch,
  mapCatalogProduct,
  mapListing,
  mapShop,
  type RawCatalogProduct,
  type RawListing,
  type RawShop,
} from "@/lib/api";
import type { CatalogProduct, Listing, Review, Shop } from "@/lib/types";
import { uniqueCatalogOffers, type UniqueOffer } from "./catalog";

export type StorefrontDb = {
  shops: Shop[];
  catalog: CatalogProduct[];
  listings: Listing[];
  reviews: Review[];
};

export async function fetchShop(shopId: string, db: StorefrontDb): Promise<Shop | null> {
  try {
    return mapShop(await apiFetch<RawShop>(`/api/shops/${shopId}`));
  } catch {
    return db.shops.find((shop) => shop.id === shopId) ?? null;
  }
}

export async function fetchShopCatalog(
  shopId: string,
  db: StorefrontDb,
  filters?: { query?: string; categoryId?: string },
): Promise<UniqueOffer[]> {
  let catalog = db.catalog;
  let listings = db.listings.filter((listing) => listing.shopId === shopId);
  let shops = db.shops;
  try {
    const [remoteShop, remoteCatalog, remoteListings] = await Promise.all([
      apiFetch<RawShop>(`/api/shops/${shopId}`).then(mapShop),
      apiFetch<RawCatalogProduct[]>("/api/catalog").then((rows) => rows.map(mapCatalogProduct)),
      apiFetch<RawListing[]>(`/api/listings/shop/${shopId}`).then((rows) => rows.map(mapListing)),
    ]);
    catalog = remoteCatalog;
    listings = remoteListings;
    shops = shops.some((shop) => shop.id === remoteShop.id)
      ? shops.map((shop) => (shop.id === remoteShop.id ? remoteShop : shop))
      : [...shops, remoteShop];
  } catch {
    /* keep local storefront snapshot */
  }
  return uniqueCatalogOffers({
    catalog,
    listings,
    nearbyShopIds: new Set([shopId]),
    shops,
    query: filters?.query,
    categoryId: filters?.categoryId,
  });
}

export type ProductInfo = {
  product: CatalogProduct;
  listings: Listing[];
  reviews: Review[];
};

export async function fetchProduct(productId: string, db: StorefrontDb): Promise<ProductInfo | null> {
  try {
    const [product, listings] = await Promise.all([
      apiFetch<RawCatalogProduct>(`/api/catalog/${productId}`).then(mapCatalogProduct),
      apiFetch<RawListing[]>("/api/listings").then((rows) => rows.map(mapListing)),
    ]);
    return {
      product,
      listings: listings.filter(
        (listing) => listing.catalogProductId === productId && listing.status === "approved",
      ),
      reviews: db.reviews.filter((review) => review.catalogProductId === productId),
    };
  } catch {
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
}
