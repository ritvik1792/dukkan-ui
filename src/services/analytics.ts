import type { CatalogProduct, Listing, Order, Review, Shop } from "@/lib/types";

export function sellerAnalytics(params: {
  shopIds: Set<string>;
  listings: Listing[];
  orders: Order[];
  reviews: Review[];
  catalog: CatalogProduct[];
}) {
  const shopOrders = params.orders.filter((o) => params.shopIds.has(o.shopId));
  const qtyByProduct = new Map<string, number>();
  let revenue = 0;
  for (const order of shopOrders) {
    revenue += order.total;
    for (const item of order.items) {
      qtyByProduct.set(
        item.catalogProductId,
        (qtyByProduct.get(item.catalogProductId) ?? 0) + item.quantity,
      );
    }
  }

  const demand = [...qtyByProduct.entries()]
    .map(([catalogProductId, qty]) => ({
      catalogProductId,
      name:
        params.catalog.find((p) => p.id === catalogProductId)?.name ??
        catalogProductId,
      qty,
    }))
    .sort((a, b) => b.qty - a.qty);

  const listingIds = new Set(
    params.listings.filter((l) => params.shopIds.has(l.shopId)).map((l) => l.id),
  );
  const shopReviews = params.reviews.filter((r) => params.shopIds.has(r.shopId));
  const avgRating =
    shopReviews.length === 0
      ? 0
      : shopReviews.reduce((s, r) => s + r.rating, 0) / shopReviews.length;

  return {
    orderCount: shopOrders.length,
    revenue,
    skuCount: listingIds.size,
    demand,
    avgRating,
    reviewCount: shopReviews.length,
  };
}

export function adminAnalytics(params: {
  shops: Shop[];
  listings: Listing[];
  orders: Order[];
  reviews: Review[];
  catalog: CatalogProduct[];
}) {
  const byShop = params.shops
    .filter((s) => s.status === "active")
    .map((shop) => {
      const orders = params.orders.filter((o) => o.shopId === shop.id);
      return {
        shop,
        orders: orders.length,
        revenue: orders.reduce((s, o) => s + o.total, 0),
        rating: shop.rating,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const qtyByProduct = new Map<string, number>();
  const areaSpend = new Map<string, number>();
  for (const order of params.orders) {
    const area = order.address.split(",").at(-1)?.trim() ?? order.address;
    areaSpend.set(area, (areaSpend.get(area) ?? 0) + order.total);
    for (const item of order.items) {
      qtyByProduct.set(
        item.catalogProductId,
        (qtyByProduct.get(item.catalogProductId) ?? 0) + item.quantity,
      );
    }
  }

  const topProducts = [...qtyByProduct.entries()]
    .map(([id, qty]) => ({
      id,
      name: params.catalog.find((p) => p.id === id)?.name ?? id,
      qty,
    }))
    .sort((a, b) => b.qty - a.qty);

  const places = [...areaSpend.entries()]
    .map(([place, spend]) => ({ place, spend }))
    .sort((a, b) => b.spend - a.spend);

  return {
    shops: byShop,
    topProducts,
    places,
    listingCount: params.listings.length,
    reviewCount: params.reviews.length,
  };
}
