/** Defaults. Live values live in platform settings (admin) so they can change without a deploy. */
export const DEFAULT_DELIVERY_RADIUS_KM = 5;
export const MIN_SHOP_RADIUS_KM = 1;
export const MAX_SHOP_RADIUS_KM = 25;
export const DEFAULT_PARTNER_ETA_MINUTES = 12;

/** Browser geolocation tuning. */
export const GEO_TIMEOUT_MS = 12_000;
export const GEO_MAX_AGE_MS = 5 * 60_000;
/** Beyond this, a GPS fix is too far from any known area to borrow its name. */
export const AREA_LABEL_MAX_KM = 15;

export const BRAND = {
  name: "pinkCarrot",
  tagline: "Products, shops & services near you.",
};

export const STORAGE_KEY = "dukkan-frontend-state-v5";

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

/** Fallback OTP shown only when the API is in OTP-dev mode. */
export const DEMO_OTP = "1234";

export const TAG_KIND_LABELS: Record<string, string> = {
  sale: "Sale",
  coupon: "Coupon",
  offer: "Offer",
  badge: "Badge",
};
