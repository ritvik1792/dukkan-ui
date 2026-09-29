"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/context/AppContext";
import { mapShop, patchShopRequest } from "@/lib/api";
import {
  DEFAULT_CLOSE_TIME,
  DEFAULT_OPEN_TIME,
  isShopOpenNow,
  shopAlertPrefs,
  shopCloseTime,
  shopHoursLabel,
  shopManuallyOpen,
  shopOpenTime,
} from "@/lib/shopOps";
import type { Shop, ShopAlertPrefs } from "@/lib/types";

export function ShopOpsSettings({ shop, compact = false }: { shop: Shop; compact?: boolean }) {
  const { dispatch } = useApp();
  const prefs = shopAlertPrefs(shop);
  const openNow = isShopOpenNow(shop);

  function patch(next: Partial<Shop>) {
    const updated = { ...shop, ...next };
    dispatch({ type: "upsertShop", shop: updated });
    const shouldPersist =
      next.isOpen !== undefined ||
      next.openTime !== undefined ||
      next.closeTime !== undefined ||
      next.notificationsEnabled !== undefined ||
      next.notifyOrderReceived !== undefined ||
      next.notifyOrderStatus !== undefined ||
      next.notifyStockConfirmation !== undefined;
    if (shouldPersist) {
      void patchShopRequest(shop.id, {
        isOpen: updated.isOpen,
        openTime: updated.openTime,
        closeTime: updated.closeTime,
        notificationsEnabled: updated.notificationsEnabled,
        notifyOrderReceived: updated.notifyOrderReceived,
        notifyOrderStatus: updated.notifyOrderStatus,
        notifyStockConfirmation: updated.notifyStockConfirmation,
      })
        .then((raw) => dispatch({ type: "upsertShop", shop: mapShop(raw) }))
        .catch(() => undefined);
    }
  }

  function patchPrefs(next: Partial<ShopAlertPrefs>) {
    const merged = { ...prefs, ...next };
    patch({
      alertPrefs: merged,
      notificationsEnabled:
        next.orders === false && next.delivered === false && next.stockConfirmation === false
          ? shop.notificationsEnabled
          : shop.notificationsEnabled,
      notifyOrderReceived: merged.orders,
      notifyOrderStatus: merged.delivered,
      notifyStockConfirmation: merged.stockConfirmation,
    });
  }

  return (
    <div className="space-y-6">
      <section className={compact ? "" : "rounded-2xl bg-white p-5"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Shop hours</h2>
            <p className="text-sm text-stone-500">
              {openNow ? "Open now" : "Closed now"} · {shopHoursLabel(shop)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => patch({ isOpen: !shopManuallyOpen(shop) })}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              shopManuallyOpen(shop) ? "bg-carrot text-white" : "border border-border bg-white"
            }`}
          >
            {shopManuallyOpen(shop) ? "Marked open" : "Marked closed"}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Opens">
            <TextInput
              type="time"
              value={shopOpenTime(shop)}
              onChange={(event) => patch({ openTime: event.target.value || DEFAULT_OPEN_TIME })}
            />
          </Field>
          <Field label="Closes">
            <TextInput
              type="time"
              value={shopCloseTime(shop)}
              onChange={(event) => patch({ closeTime: event.target.value || DEFAULT_CLOSE_TIME })}
            />
          </Field>
        </div>
      </section>

      <section className={compact ? "" : "rounded-2xl bg-white p-5"}>
        <h2 className="font-semibold">Alerts & notifications</h2>
        <p className="text-sm text-stone-500">
          Alerts pop up when you are signed in. If you are signed out, they wait in the bell.
        </p>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Notifications"
            checked={shop.notificationsEnabled !== false}
            onChange={(checked) => patch({ notificationsEnabled: checked })}
          />
          {(
            [
              ["orders", "New orders"],
              ["reviews", "New reviews"],
              ["complaints", "Complaints & support"],
              ["delivered", "Order status / delivered"],
              ["stockConfirmation", "Stock confirmation requests"],
            ] as const
          ).map(([key, label]) => (
            <Toggle
              key={key}
              label={label}
              checked={prefs[key]}
              onChange={(checked) => patchPrefs({ [key]: checked })}
            />
          ))}
        </div>

        <h3 className="mt-5 text-sm font-semibold">Order reminders</h3>
        <p className="text-xs text-stone-500">
          A new order notifies the seller to accept it. This is not quick delivery, so packing and
          dispatch are not timed. If the order is still not delivered after 24 hours, one reminder
          is sent.
        </p>
      </section>
    </div>
  );
}
