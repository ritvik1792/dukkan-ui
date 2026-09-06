import type {
  CatalogProduct,
  Listing,
  Order,
  Review,
  SellerApplication,
  Shop,
  Ticket,
} from "@/lib/types";

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
  applications: SellerApplication[];
  tickets: Ticket[];
}) {
  const shops = params.shops
    .map((shop) => {
      const orders = params.orders.filter((o) => o.shopId === shop.id);
      const listings = params.listings.filter((l) => l.shopId === shop.id);
      const reviews = params.reviews.filter((r) => r.shopId === shop.id);
      const avgRating =
        reviews.length === 0
          ? shop.rating
          : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      return {
        shop,
        orders: orders.length,
        revenue: orders.reduce((s, o) => s + o.total, 0),
        rating: avgRating,
        listingCount: listings.length,
        liveListingCount: listings.filter((l) => l.status === "approved").length,
        reviewCount: reviews.length,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const qtyByProduct = new Map<string, number>();
  const areaSpend = new Map<string, number>();
  let revenue = 0;
  for (const order of params.orders) {
    revenue += order.total;
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

  const applications = {
    submitted: params.applications.filter((a) => a.status === "submitted").length,
    underReview: params.applications.filter((a) => a.status === "under_review").length,
    approved: params.applications.filter((a) => a.status === "approved").length,
    rejected: params.applications.filter((a) => a.status === "rejected").length,
    awaiting: params.applications.filter(
      (a) => a.status === "submitted" || a.status === "under_review",
    ),
  };

  const tickets = {
    open: params.tickets.filter((t) => t.status === "open").length,
    inProgress: params.tickets.filter((t) => t.status === "in_progress").length,
    resolved: params.tickets.filter((t) => t.status === "resolved").length,
    closed: params.tickets.filter((t) => t.status === "closed").length,
    complaints: params.tickets.filter((t) => t.kind === "complaint").length,
    support: params.tickets.filter((t) => t.kind === "support").length,
    active: params.tickets.filter((t) => t.status === "open" || t.status === "in_progress"),
  };

  const avgRating =
    params.reviews.length === 0
      ? 0
      : params.reviews.reduce((s, r) => s + r.rating, 0) / params.reviews.length;

  return {
    shops,
    topProducts,
    places,
    listingCount: params.listings.length,
    liveListingCount: params.listings.filter((l) => l.status === "approved").length,
    hiddenListingCount: params.listings.filter((l) => l.status === "rejected").length,
    reviewCount: params.reviews.length,
    avgRating,
    orderCount: params.orders.length,
    revenue,
    activeShopCount: params.shops.filter((s) => s.status === "active").length,
    pendingShopCount: params.shops.filter((s) => s.status === "pending").length,
    suspendedShopCount: params.shops.filter((s) => s.status === "suspended").length,
    applications,
    tickets,
  };
}
