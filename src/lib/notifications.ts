import { createId } from "@/lib/ids";
import { orderStatusLabel, orderTimeline, normalizeOrderStatus } from "@/lib/orders";
import {
  adminConsolePath,
  orderDetailPath,
  sellerConsolePath,
} from "@/lib/routes";
import { SLA_STEPS, shopAlertPrefs } from "@/lib/shopOps";
import type {
  AppNotification,
  AppNotificationKind,
  Order,
  OrderStatus,
  ProductRequest,
  Review,
  Shop,
  ShopSlaStep,
  Ticket,
} from "@/lib/types";

export const NOTIFICATION_CAP = 80;

type ShopLookup = { shops: Shop[] };

export function notificationHref(item: AppNotification, role?: string) {
  if (item.kind === "stock_confirmation") {
    const q = item.requestId ? `?request=${encodeURIComponent(item.requestId)}` : "";
    return `${sellerConsolePath("/requests")}${q}`;
  }
  if (item.kind === "review" && item.reviewId) {
    const q = `review=${encodeURIComponent(item.reviewId)}`;
    if (role === "admin") return `${adminConsolePath("/reviews")}?${q}`;
    if (role === "seller") return `${sellerConsolePath("/reviews")}?${q}`;
    return item.orderId ? orderDetailPath(item.orderId, role) : "/account/orders";
  }
  if (item.kind === "complaint" && item.ticketId) {
    const q = `ticket=${encodeURIComponent(item.ticketId)}`;
    if (role === "admin") return `${adminConsolePath("/tickets")}?${q}`;
    if (role === "seller") return `${sellerConsolePath("/tickets")}?${q}`;
    return `/account/tickets?${q}`;
  }
  if (item.orderId) return orderDetailPath(item.orderId, role);
  if (role === "admin") return adminConsolePath();
  if (role === "seller") return sellerConsolePath("/orders");
  return "/account/orders";
}

export function mergeNotifications(list: AppNotification[], incoming: AppNotification[]) {
  if (!incoming.length) return list;
  const seen = new Set(list.map((item) => item.dedupeKey));
  const extra = incoming.filter((item) => !seen.has(item.dedupeKey));
  if (!extra.length) return list;
  return [...extra, ...list].slice(0, NOTIFICATION_CAP);
}

function note(
  input: Omit<AppNotification, "id" | "createdAt"> & { createdAt?: string },
): AppNotification {
  const { createdAt, ...rest } = input;
  return {
    ...rest,
    id: createId("ntf"),
    createdAt: createdAt ?? new Date().toISOString(),
  };
}

function ownerOf(shops: Shop[], shopId: string) {
  return shops.find((shop) => shop.id === shopId);
}

export function notificationsForOrder(state: ShopLookup, order: Order): AppNotification[] {
  const shop = ownerOf(state.shops, order.shopId);
  if (!shop) return [];
  const prefs = shopAlertPrefs(shop);
  if (!prefs.orders) return [];
  return [
    note({
      userId: shop.ownerUserId,
      shopId: shop.id,
      kind: "order",
      title: "New order",
      message: `${order.id} · ${shop.name}`,
      orderId: order.id,
      dedupeKey: `order:${order.id}`,
    }),
  ];
}

export function notificationsForDelivered(state: ShopLookup, order: Order): AppNotification[] {
  const shop = ownerOf(state.shops, order.shopId);
  if (!shop) return [];
  const prefs = shopAlertPrefs(shop);
  if (!prefs.delivered) return [];
  return [
    note({
      userId: shop.ownerUserId,
      shopId: shop.id,
      kind: "delivered",
      title: "Order delivered",
      message: `${order.id} is marked delivered.`,
      orderId: order.id,
      dedupeKey: `delivered:${order.id}`,
    }),
  ];
}

export function notificationsForReview(state: ShopLookup, review: Review): AppNotification[] {
  const shop = ownerOf(state.shops, review.shopId);
  if (!shop) return [];
  const prefs = shopAlertPrefs(shop);
  if (!prefs.reviews) return [];
  return [
    note({
      userId: shop.ownerUserId,
      shopId: shop.id,
      kind: "review",
      title: "New review",
      message: `${review.rating}★ · ${review.title || shop.name}`,
      reviewId: review.id,
      orderId: review.orderId,
      dedupeKey: `review:${review.id}`,
    }),
  ];
}

export function notificationsForTicket(state: ShopLookup, ticket: Ticket): AppNotification[] {
  if (!ticket.shopId) return [];
  const shop = ownerOf(state.shops, ticket.shopId);
  if (!shop) return [];
  const prefs = shopAlertPrefs(shop);
  if (!prefs.complaints) return [];
  const kindLabel = ticket.kind === "complaint" ? "Complaint" : "Support ticket";
  return [
    note({
      userId: shop.ownerUserId,
      shopId: shop.id,
      kind: "complaint",
      title: kindLabel,
      message: ticket.subject,
      ticketId: ticket.id,
      orderId: ticket.orderId,
      dedupeKey: `ticket:${ticket.id}`,
    }),
  ];
}

/** Bell items for open stock-confirmation / availability requests (client-composed). */
export function notificationsForMerchantAvailability(input: {
  shops: Shop[];
  rows: Array<{
    request: ProductRequest;
    shopId: string;
    status: string;
    notifiedAt?: string;
  }>;
  productName?: (catalogProductId: string) => string | undefined;
}): AppNotification[] {
  const out: AppNotification[] = [];
  for (const row of input.rows) {
    if (row.status !== "NOTIFIED" && row.status !== "VIEWED") continue;
    const shop = ownerOf(input.shops, row.shopId);
    if (!shop) continue;
    const prefs = shopAlertPrefs(shop);
    if (!prefs.stockConfirmation) continue;
    const name =
      input.productName?.(row.request.catalogProductId) ??
      row.request.queryText ??
      row.request.catalogProductId;
    const budget =
      row.request.maxBudget != null ? ` · under ₹${Math.round(row.request.maxBudget)}` : "";
    out.push(
      note({
        userId: shop.ownerUserId,
        shopId: shop.id,
        kind: "stock_confirmation",
        title: "New customer request",
        message: `${name}${budget}`,
        requestId: row.request.id,
        dedupeKey: `availability:${row.request.id}:${row.shopId}`,
        createdAt: row.notifiedAt ?? row.request.createdAt,
      }),
    );
  }
  return out;
}

function statusEnteredAt(order: Order, status: OrderStatus) {
  const events = orderTimeline(order);
  const match = [...events].reverse().find((event) => event.status === status);
  return match?.at ?? order.createdAt;
}

export function slaNotificationsDue(input: {
  shops: Shop[];
  orders: Order[];
  existing: AppNotification[];
  now?: Date;
}): AppNotification[] {
  const now = input.now ?? new Date();
  const known = new Set(input.existing.map((item) => item.dedupeKey));
  const due: AppNotification[] = [];
  const slaIds = new Set(SLA_STEPS.map((step) => step.id));

  for (const order of input.orders) {
    const status = normalizeOrderStatus(order.status);
    if (!slaIds.has(status as ShopSlaStep) || status === "delivered" || status === "cancelled") {
      continue;
    }
    const shop = ownerOf(input.shops, order.shopId);
    if (!shop) continue;
    const pref = shopAlertPrefs(shop).sla[status as ShopSlaStep];
    if (!pref?.enabled || pref.afterMinutes <= 0) continue;
    const key = `sla:${order.id}:${status}`;
    if (known.has(key)) continue;
    const entered = new Date(statusEnteredAt(order, status)).getTime();
    if (!Number.isFinite(entered)) continue;
    const waitMs = pref.afterMinutes * 60_000;
    if (now.getTime() - entered < waitMs) continue;
    const maxAgeMs = 12 * 60 * 60 * 1000;
    if (now.getTime() - entered > maxAgeMs) continue;
    due.push(
      note({
        userId: shop.ownerUserId,
        shopId: shop.id,
        kind: "order_sla",
        title: `${orderStatusLabel(status)} is overdue`,
        message: `${order.id} still at ${orderStatusLabel(status).toLowerCase()} after ${pref.afterMinutes} min.`,
        orderId: order.id,
        dedupeKey: key,
      }),
    );
  }
  return due;
}

export function alertTone(kind: AppNotificationKind) {
  if (kind === "order_sla") return "warning" as const;
  if (kind === "complaint") return "warning" as const;
  if (kind === "delivered") return "success" as const;
  return "info" as const;
}
