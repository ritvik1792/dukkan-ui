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
  name: "Pink Carrot",
  tagline: "Products, shops & services near you.",
};

export const STORAGE_KEY = "dukkan-frontend-state-v5";

/** Soft peach / rose-pink tints only — keep circles on-brand. */
export const CATEGORY_HUES: Record<string, number> = {
  grocery: 18,
  fresh: 12,
  dairy: 28,
  snacks: 8,
  home: 22,
  electronics: 32,
  industrial: 26,
  apparel: 350,
  fashion: 355,
  salon: 15,
  "home-repair": 20,
  "ac-repair": 24,
  beauty: 350,
  fitness: 10,
  tutors: 30,
  restaurants: 14,
  "auto-services": 22,
};

/** Default art tint when no category hue is known (warm rose-gold). */
export const BRAND_FALLBACK_HUE = 18;

const BRAND_HUE_VALUES = Object.values(CATEGORY_HUES);

/** Random tint constrained to the rose-gold / champagne band used across the UI. */
export function randomBrandHue(): number {
  return BRAND_HUE_VALUES[Math.floor(Math.random() * BRAND_HUE_VALUES.length)] ?? BRAND_FALLBACK_HUE;
}

/**
 * Home-page category segments. Users pick intent first, then see a short
 * circle row — simple and focused, without noisy service clutter.
 */
export const CATEGORY_GROUPS: {
  id: string;
  label: string;
  /** `"popular"` uses POPULAR_CATEGORY_IDS; otherwise an explicit id list. */
  categoryIds: string[] | "popular";
}[] = [
  { id: "popular", label: "Popular", categoryIds: "popular" },
  {
    id: "daily",
    label: "Daily & Food",
    categoryIds: ["grocery", "fresh", "dairy", "snacks", "restaurants"],
  },
  {
    id: "beauty",
    label: "Beauty & Care",
    categoryIds: ["beauty", "salon", "fitness"],
  },
  {
    id: "shopping",
    label: "Shopping & Tech",
    categoryIds: ["electronics", "apparel", "fashion", "home"],
  },
];

/** Curated everyday essentials shown under Popular (keeps UI clean and uncluttered). */
export const POPULAR_CATEGORY_IDS = [
  "restaurants",
  "grocery",
  "fresh",
  "dairy",
  "snacks",
  "beauty",
  "salon",
  "electronics",
  "fashion",
];

export const VIEW_STORAGE_KEY = "dukkan-view-selection-v1";

/** Fallback OTP shown only when the API is in OTP-dev mode. */
export const DEMO_OTP = "1234";

export const TAG_KIND_LABELS: Record<string, string> = {
  sale: "Sale",
  coupon: "Coupon",
  offer: "Offer",
  badge: "Badge",
};
