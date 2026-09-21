import type { Shop, ShopAlertPrefs, ShopSlaStep } from "@/lib/types";

export const DEFAULT_OPEN_TIME = "09:00";
export const DEFAULT_CLOSE_TIME = "21:00";

export const SLA_STEPS: { id: ShopSlaStep; label: string; hint: string }[] = [
  { id: "placed", label: "New order waiting", hint: "Still not packing" },
  { id: "packing", label: "Packing running long", hint: "Not marked ready" },
  { id: "ready_for_delivery", label: "Ready too long", hint: "Not given to delivery" },
  { id: "out_for_delivery", label: "Out for delivery too long", hint: "Not marked delivered" },
];

export function defaultAlertPrefs(): ShopAlertPrefs {
  return {
    orders: true,
    reviews: true,
    complaints: true,
    delivered: true,
    stockConfirmation: true,
    sla: {
      placed: { enabled: true, afterMinutes: 15 },
      packing: { enabled: true, afterMinutes: 20 },
      ready_for_delivery: { enabled: true, afterMinutes: 15 },
      out_for_delivery: { enabled: true, afterMinutes: 30 },
    },
  };
}

export function shopAlertPrefs(shop: Shop): ShopAlertPrefs {
  const defaults = defaultAlertPrefs();
  const sla = shop.alertPrefs?.sla;
  const master = shop.notificationsEnabled !== false;
  return {
    orders: master && (shop.notifyOrderReceived ?? shop.alertPrefs?.orders ?? defaults.orders),
    reviews: shop.alertPrefs?.reviews ?? defaults.reviews,
    complaints: shop.alertPrefs?.complaints ?? defaults.complaints,
    delivered: master && (shop.notifyOrderStatus ?? shop.alertPrefs?.delivered ?? defaults.delivered),
    stockConfirmation:
      master &&
      (shop.notifyStockConfirmation ?? shop.alertPrefs?.stockConfirmation ?? defaults.stockConfirmation),
    sla: {
      placed: { ...defaults.sla.placed, ...sla?.placed },
      packing: { ...defaults.sla.packing, ...sla?.packing },
      ready_for_delivery: { ...defaults.sla.ready_for_delivery, ...sla?.ready_for_delivery },
      out_for_delivery: { ...defaults.sla.out_for_delivery, ...sla?.out_for_delivery },
    },
  };
}

export function shopOpenTime(shop: Shop) {
  return shop.openTime || DEFAULT_OPEN_TIME;
}

export function shopCloseTime(shop: Shop) {
  return shop.closeTime || DEFAULT_CLOSE_TIME;
}

export function shopManuallyOpen(shop: Shop) {
  return shop.isOpen !== false;
}

function minutesFromClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function isWithinShopHours(shop: Shop, at = new Date()) {
  const start = minutesFromClock(shopOpenTime(shop));
  const end = minutesFromClock(shopCloseTime(shop));
  const now = at.getHours() * 60 + at.getMinutes();
  if (end === start) return true;
  if (end < start) return now >= start || now < end;
  return now >= start && now < end;
}

/** Manual close wins. When marked open, hours still decide if it is open right now. */
export function isShopOpenNow(shop: Shop, at = new Date()) {
  if (!shopManuallyOpen(shop)) return false;
  return isWithinShopHours(shop, at);
}

export function shopHoursLabel(shop: Shop) {
  return `${shopOpenTime(shop)} – ${shopCloseTime(shop)}`;
}

export function mergeShopOps(shop: Shop, fallback?: Shop): Shop {
  const prefs = shopAlertPrefs({
    ...shop,
    alertPrefs: shop.alertPrefs ?? fallback?.alertPrefs,
    notificationsEnabled: shop.notificationsEnabled ?? fallback?.notificationsEnabled,
    notifyOrderReceived: shop.notifyOrderReceived ?? fallback?.notifyOrderReceived,
    notifyOrderStatus: shop.notifyOrderStatus ?? fallback?.notifyOrderStatus,
    notifyStockConfirmation: shop.notifyStockConfirmation ?? fallback?.notifyStockConfirmation,
  });
  return {
    ...shop,
    isOpen: shop.isOpen ?? fallback?.isOpen ?? true,
    openTime: shop.openTime ?? fallback?.openTime ?? DEFAULT_OPEN_TIME,
    closeTime: shop.closeTime ?? fallback?.closeTime ?? DEFAULT_CLOSE_TIME,
    notificationsEnabled: shop.notificationsEnabled ?? fallback?.notificationsEnabled ?? true,
    notifyOrderReceived: shop.notifyOrderReceived ?? fallback?.notifyOrderReceived ?? true,
    notifyOrderStatus: shop.notifyOrderStatus ?? fallback?.notifyOrderStatus ?? true,
    notifyStockConfirmation:
      shop.notifyStockConfirmation ?? fallback?.notifyStockConfirmation ?? true,
    alertPrefs: prefs,
    employees: shop.employees ?? fallback?.employees ?? [],
    transport: shop.transport ?? fallback?.transport ?? [],
  };
}
