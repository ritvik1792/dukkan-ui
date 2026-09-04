/** Defaults. Live values live in platform settings (admin) so they can change without a deploy. */
export const DEFAULT_DELIVERY_RADIUS_KM = 5;
export const MIN_SHOP_RADIUS_KM = 1;
export const MAX_SHOP_RADIUS_KM = 25;
export const DEFAULT_PARTNER_ETA_MINUTES = 12;

export const BRAND = {
  name: "Dukkan",
  tagline: "Nearby shops. Fast delivery.",
};

export const STORAGE_KEY = "dukkan-frontend-state-v4";

export const CATEGORY_HUES: Record<string, number> = {
  grocery: 32,
  fresh: 128,
  dairy: 200,
  snacks: 18,
  home: 25,
  electronics: 255,
  industrial: 220,
  apparel: 340,
};

export const VIEW_STORAGE_KEY = "dukkan-view-selection-v1";

/** Shared password for seeded demo accounts until Spring Boot auth. */
export const DEMO_PASSWORD = "dukkan123";

export const TAG_KIND_LABELS: Record<string, string> = {
  sale: "Sale",
  coupon: "Coupon",
  offer: "Offer",
  badge: "Badge",
};
