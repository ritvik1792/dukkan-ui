"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { mapShop, patchShopRequest } from "@/lib/api";
import {
  DEFAULT_CLOSE_TIME,
  DEFAULT_OPEN_TIME,
  SLA_STEPS,
  isShopOpenNow,
  shopAlertPrefs,
  shopCloseTime,
  shopHoursLabel,
  shopManuallyOpen,
  shopOpenTime,
} from "@/lib/shopOps";
import type { Shop, ShopAlertPrefs, ShopSlaStep } from "@/lib/types";

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

  function patchSla(step: ShopSlaStep, next: Partial<ShopAlertPrefs["sla"][ShopSlaStep]>) {
    patchPrefs({
      sla: {
        ...prefs.sla,
        [step]: { ...prefs.sla[step], ...next },
      },
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
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shop.notificationsEnabled !== false}
              onChange={(event) => patch({ notificationsEnabled: event.target.checked })}
            />
            Notifications enabled
          </label>
          {(
            [
              ["orders", "New orders"],
              ["reviews", "New reviews"],
              ["complaints", "Complaints & support"],
              ["delivered", "Order status / delivered"],
              ["stockConfirmation", "Stock confirmation requests"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(event) => patchPrefs({ [key]: event.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>

        <h3 className="mt-5 text-sm font-semibold">Stuck-order reminders</h3>
        <p className="text-xs text-stone-500">
          If an order stays on a step longer than this, send a notification. Turn each step on or off.
        </p>
        <ul className="mt-3 space-y-3">
          {SLA_STEPS.map((step) => {
            const row = prefs.sla[step.id];
            return (
              <li
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream px-3 py-2.5"
              >
                <label className="flex min-w-0 flex-1 items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={row.enabled}
                    onChange={(event) => patchSla(step.id, { enabled: event.target.checked })}
                  />
                  <span>
                    <span className="font-medium">{step.label}</span>
                    <span className="block text-xs text-stone-500">{step.hint}</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  After
                  <TextInput
                    type="number"
                    min={1}
                    className="w-20"
                    disabled={!row.enabled}
                    value={row.afterMinutes}
                    onChange={(event) =>
                      patchSla(step.id, {
                        afterMinutes: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                  min
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
