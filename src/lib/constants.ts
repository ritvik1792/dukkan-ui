/**
 * Delivery / discovery radius. Change this later when backend geo-search is live.
 * Products and shops farther than this from the buyer are hidden from nearby results.
 */
export const DELIVERY_RADIUS_KM = 5;

/** Estimated partner-delivery window for in-radius shops (Zepto-style). */
export const PARTNER_ETA_MINUTES = 12;

export const BRAND = {
  name: "Dukkan",
  tagline: "Nearby shops. Fast delivery.",
};

export const STORAGE_KEY = "dukkan-frontend-state-v1";
