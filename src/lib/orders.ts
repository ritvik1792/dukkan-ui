import { fallbackPaymentRefId } from "@/lib/format";
import type { Order, OrderEvent, OrderStatus, Shop, User } from "@/lib/types";

export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "packing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
];

export const ORDER_STATUS_FILTERS: OrderStatus[] = [
  "placed",
  "packing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function normalizeOrderStatus(status: OrderStatus): OrderStatus {
  if (status === "accepted") return "packing";
  if (status === "assigned") return "ready_for_delivery";
  return status;
}

export function orderStatusLabel(status: OrderStatus): string {
  switch (normalizeOrderStatus(status)) {
    case "placed":
      return "Placed";
    case "packing":
      return "Packing";
    case "ready_for_delivery":
      return "Ready for delivery";
    case "out_for_delivery":
      return "Given to delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replaceAll("_", " ");
  }
}

export type OrderAdvance = {
  status: OrderStatus;
  label: string;
};

export function nextOrderAdvance(status: OrderStatus): OrderAdvance | null {
  switch (normalizeOrderStatus(status)) {
    case "placed":
      return { status: "packing", label: "Start packing" };
    case "packing":
      return { status: "ready_for_delivery", label: "Ready for delivery" };
    case "ready_for_delivery":
      return { status: "out_for_delivery", label: "Give to delivery" };
    case "out_for_delivery":
      return { status: "delivered", label: "Mark delivered" };
    default:
      return null;
  }
}

export function migrateOrder(order: Order): Order {
  const paymentMethod = order.paymentMethod ?? "cod";
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    paymentMethod,
    paymentStatus: order.paymentStatus ?? (paymentMethod === "cod" ? "cod" : "paid"),
    paymentRefId: order.paymentRefId ?? fallbackPaymentRefId(order.id, paymentMethod),
    timeline: order.timeline?.map((event) => ({
      ...event,
      status: normalizeOrderStatus(event.status),
    })),
  };
}

export function orderTimeline(order: Order): OrderEvent[] {
  if (order.timeline?.length) {
    return order.timeline.map((event) => ({
      ...event,
      status: normalizeOrderStatus(event.status),
    }));
  }

  const status = normalizeOrderStatus(order.status);
  if (status === "cancelled") {
    return [
      { status: "placed", at: order.createdAt },
      { status: "cancelled", at: order.createdAt },
    ];
  }

  const index = ORDER_FLOW.indexOf(status);
  if (index < 0) return [{ status, at: order.createdAt }];
  return ORDER_FLOW.slice(0, index + 1).map((step, stepIndex) => ({
    status: step,
    at: stepIndex === 0 ? order.createdAt : order.createdAt,
  }));
}

export function appendOrderEvent(
  order: Order,
  status: OrderStatus,
  at = new Date().toISOString(),
): OrderEvent[] {
  const current = orderTimeline(order);
  const next = normalizeOrderStatus(status);
  if (current.at(-1)?.status === next) return current;
  return [...current, { status: next, at }];
}

export function shopStaff(users: User[], shop?: Shop): User[] {
  const seen = new Set<string>();
  const staff: User[] = [];
  for (const user of users) {
    const isOwner = Boolean(shop && user.id === shop.ownerUserId);
    if (!isOwner && user.role !== "admin") continue;
    if (seen.has(user.id)) continue;
    seen.add(user.id);
    staff.push(user);
  }
  return staff;
}

export function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
