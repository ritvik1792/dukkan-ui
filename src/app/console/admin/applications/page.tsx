"use client";

import { ShopNameButton, useShopPeek } from "@/components/shops/ShopPeek";
import { Field, Select } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { mapApplication, patchApplicationRequest } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";
import { useMemo, useState } from "react";

export default function AdminApplications() {
  const { state, dispatch, shopById } = useApp();
  const { showAlert } = useAlert();
  const peek = useShopPeek();
  const [statusFilter, setStatusFilter] = useState("");

  const applications = useMemo(() => {
    return state.applications.filter((app) => !statusFilter || app.status === statusFilter);
  }, [state.applications, statusFilter]);

  const awaiting = state.applications.filter(
    (app) => app.status === "submitted" || app.status === "under_review",
  ).length;

  function setStatus(applicationId: string, shopId: string, status: ApplicationStatus) {
    dispatch({ type: "setApplicationStatus", applicationId, status });
    if (status === "approved") {
      dispatch({ type: "setShopStatus", shopId, status: "active" });
      showAlert({
        tone: "success",
        title: "Shop approved",
        message: "This dukkan is live. Their products can appear to buyers.",
      });
    } else if (status === "rejected") {
      dispatch({ type: "setShopStatus", shopId, status: "pending" });
      showAlert({ tone: "info", title: "Application rejected" });
    } else {
      showAlert({ tone: "info", title: "Marked under review" });
    }
    void patchApplicationRequest(applicationId, status)
      .then((updated) =>
        dispatch({
          type: "setApplicationStatus",
          applicationId: updated.id,
          status: mapApplication(updated).status,
        }),
      )
      .catch(() => undefined);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Join requests</h1>
      <p className="mt-1 text-sm text-stone-500">
        Seller applications are not auto-approved. Review the shop, then approve or reject.
        {awaiting ? ` ${awaiting} waiting.` : " Queue is clear."}
      </p>
      <div className="mt-4 max-w-xs">
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All requests</option>
            {(["submitted", "under_review", "approved", "rejected"] as ApplicationStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ),
            )}
          </Select>
        </Field>
      </div>
      <ul className="mt-6 space-y-3">
        {applications.map((app) => {
          const shop = shopById(app.shopId);
          return (
            <li
              key={app.id}
              className={`rounded-2xl bg-white p-4 ${shop ? "cursor-pointer transition-colors duration-150 hover:bg-stone-50" : ""}`}
              onClick={shop ? () => peek?.openShop(shop.id) : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <ShopNameButton
                    shopId={shop?.id}
                    className="font-semibold underline decoration-stone-300 hover:decoration-ink"
                  >
                    {app.businessName}
                  </ShopNameButton>
                  <p className="text-sm text-stone-500">
                    {app.ownerName} · {app.email} · {app.phone}
                  </p>
                  <p className="mt-1 text-sm">{app.address}</p>
                  {app.gstin && <p className="text-xs text-stone-400">GSTIN {app.gstin}</p>}
                  {app.notes && <p className="mt-2 text-sm text-stone-600">{app.notes}</p>}
                  <p className="text-xs text-stone-400">{formatDate(app.submittedAt)}</p>
                  {shop && (
                    <p className="mt-1 text-xs text-stone-400">
                      Shop status: {titleCase(shop.status)}
                    </p>
                  )}
                </div>
                <StatusPill>{titleCase(app.status)}</StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                  onClick={() => setStatus(app.id, app.shopId, "approved")}
                >
                  Approve shop
                </button>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs"
                  onClick={() => setStatus(app.id, app.shopId, "rejected")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs"
                  onClick={() => setStatus(app.id, app.shopId, "under_review")}
                >
                  Under review
                </button>
              </div>
            </li>
          );
        })}
        {applications.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-sm text-stone-500">
            No join requests match this filter.
          </li>
        )}
      </ul>
    </div>
  );
}
