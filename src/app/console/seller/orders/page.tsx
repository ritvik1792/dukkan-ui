"use client";

import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { partners } from "@/data/seed";
import { formatDate, formatInr, paymentMethodLabel } from "@/lib/format";
import {
  nextOrderAdvance,
  normalizeOrderStatus,
  ORDER_STATUS_FILTERS,
  orderStatusLabel,
} from "@/lib/orders";
import type { DeliveryMode, Order, OrderStatus } from "@/lib/types";
import { afterPaint } from "@/lib/drawer";
import { useEffect, useMemo, useState } from "react";

export default function SellerOrders() {
  const { user, state, dispatch, shopById, catalogById } = useApp();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "total">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((s) => user && (s.ownerUserId === user.id || user.role === "admin"))
          .map((s) => s.id),
      ),
    [state.shops, user],
  );
  const orders = useMemo(
    () => state.orders.filter((o) => shopIds.has(o.shopId)),
    [state.orders, shopIds],
  );
  const shops = useMemo(
    () => state.shops.filter((s) => shopIds.has(s.id)),
    [state.shops, shopIds],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = orders.filter((order) => {
      const status = normalizeOrderStatus(order.status);
      if (statusFilter && status !== statusFilter) return false;
      if (deliveryFilter && order.deliveryMode !== deliveryFilter) return false;
      if (shopFilter && order.shopId !== shopFilter) return false;
      if (!q) return true;
      const shop = shopById(order.shopId);
      const buyer = state.users.find((u) => u.id === order.buyerId);
      const items = order.items
        .map((item) => catalogById(item.catalogProductId)?.name ?? "")
        .join(" ");
      return `${order.id} ${order.paymentRefId ?? ""} ${shop?.name ?? ""} ${buyer?.name ?? ""} ${order.address} ${items}`
        .toLowerCase()
        .includes(q);
    });
    return rows.sort((a, b) => {
      if (sort === "total") return b.total - a.total;
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "oldest" ? diff : -diff;
    });
  }, [
    orders,
    search,
    statusFilter,
    deliveryFilter,
    shopFilter,
    sort,
    shopById,
    catalogById,
    state.users,
  ]);

  const selected = orders.find((o) => o.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [selectedId]);

  if (!user) return null;

  function openOrder(orderId: string) {
    setSelectedId(orderId);
  }

  function closeSheet() {
    setDrawerShown(false);
    window.setTimeout(() => setSelectedId(null), 320);
  }

  function advanceOrder(order: Order) {
    const next = nextOrderAdvance(order.status);
    if (!next) return;
    if (next.status === "out_for_delivery" && order.deliveryMode === "partner" && !order.partnerId) {
      showAlert({
        tone: "warning",
        title: "Pick a rider first",
        message: "Open the order and choose a partner before giving it to delivery.",
      });
      openOrder(order.id);
      return;
    }
    dispatch({ type: "setOrderStatus", orderId: order.id, status: next.status });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="mt-1 text-sm text-stone-500">
            Search and filter the table. Click a row for timelines, tickets, and reviews.
          </p>
        </div>
        <p className="text-sm text-stone-500">{filtered.length} shown</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order, payment ref, customer, product"
          />
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabel(status as OrderStatus)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Delivery">
          <Select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value as DeliveryMode | "")}
          >
            <option value="">All modes</option>
            <option value="partner">Partner</option>
            <option value="shop">Shop delivery</option>
          </Select>
        </Field>
        <Field label="Dukkan">
          <Select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
            <option value="">All shops</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sort">
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="total">Highest total</option>
          </Select>
        </Field>
      </div>

      <div className="animate-fade-up mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => {
              const shop = shopById(order.shopId);
              const buyer = state.users.find((u) => u.id === order.buyerId);
              const partner = partners.find((p) => p.id === order.partnerId);
              const status = normalizeOrderStatus(order.status);
              const next = nextOrderAdvance(status);
              const itemLabel = order.items
                .map((item) => `${catalogById(item.catalogProductId)?.name ?? "Item"} × ${item.quantity}`)
                .join(", ");
              const ticketCount = state.tickets.filter((t) => t.orderId === order.id).length;
              return (
                <tr
                  key={order.id}
                  className="cursor-pointer border-b last:border-0 transition-colors duration-150 hover:bg-stone-50"
                  onClick={() => openOrder(order.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.id}</p>
                    <p className="text-xs text-stone-400">
                      {order.paymentRefId ? `${order.paymentRefId} · ` : ""}
                      {shop?.name} · {formatDate(order.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{buyer?.name ?? order.buyerId}</td>
                  <td className="max-w-[220px] truncate px-4 py-3" title={itemLabel}>
                    {itemLabel}
                    {ticketCount > 0 && (
                      <span className="ml-2 text-xs text-amber-800">{ticketCount} ticket</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatInr(order.total)}
                    {order.paymentMethod ? (
                      <span className="block text-xs text-stone-400">
                        {paymentMethodLabel(order.paymentMethod)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill>{orderStatusLabel(status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {order.deliveryMode === "partner" ? "Partner" : "Shop"}
                    {partner ? ` · ${partner.name}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {next ? (
                      <button
                        type="button"
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-lime"
                        onClick={(e) => {
                          e.stopPropagation();
                          advanceOrder(order);
                        }}
                      >
                        {next.label}
                      </button>
                    ) : (
                      <span className="text-xs text-stone-400">Done</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailSheet
          order={selected}
          mode="seller"
          shown={drawerShown}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
