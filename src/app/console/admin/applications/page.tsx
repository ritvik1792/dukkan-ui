"use client";

import { ApplicationTracker } from "@/components/seller/ApplicationTracker";
import { ShopNameButton } from "@/components/shops/ShopPeek";
import { Field, Select } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { isLocalApi, mapApplication, patchApplicationRequest } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";
import { useMemo, useState } from "react";

export default function AdminApplications() {
  const { state, dispatch, shopById } = useApp();
  const { showAlert } = useAlert();
  const [statusFilter, setStatusFilter] = useState("waiting");
  const [openId, setOpenId] = useState("");
  const [pending, setPending] = useState<{ id: string; status: ApplicationStatus } | null>(null);

  const applications = useMemo(() => {
    return state.applications.filter((app) => {
      if (statusFilter === "waiting") {
        return app.status === "submitted" || app.status === "under_review";
      }
      return !statusFilter || app.status === statusFilter;
    });
  }, [state.applications, statusFilter]);

  const awaiting = state.applications.filter(
    (app) => app.status === "submitted" || app.status === "under_review",
  ).length;

  async function setStatus(applicationId: string, shopId: string, status: ApplicationStatus) {
    if (pending) return;
    setPending({ id: applicationId, status });
    try {
      let next = status;
      try {
        next = mapApplication(await patchApplicationRequest(applicationId, { status })).status;
      } catch (err) {
        if (!isLocalApi(err)) throw err;
      }
      dispatch({ type: "setApplicationStatus", applicationId, status: next });
      if (next === "approved") {
        dispatch({ type: "setShopStatus", shopId, status: "active" });
        showAlert({
          tone: "success",
          title: "Shop approved",
          message: "This dukkan is live and has left the waiting queue.",
        });
      } else if (next === "rejected") {
        dispatch({ type: "setShopStatus", shopId, status: "pending" });
        showAlert({ tone: "info", title: "Application rejected" });
      } else {
        showAlert({ tone: "info", title: "Marked under review" });
      }
    } catch (err) {
      showAlert({
        tone: "error",
        title: "Could not update this request",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setPending(null);
    }
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
            <option value="waiting">Waiting for review</option>
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
            <li key={app.id} className="rounded-2xl bg-white p-4">
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
                  <p className="text-xs text-stone-400">
                    {app.id} · {formatDate(app.submittedAt)}
                  </p>
                  {app.reviewNote && (
                    <p className="mt-2 text-sm text-stone-600">{app.reviewNote}</p>
                  )}
                  {shop && (
                    <p className="mt-1 text-xs text-stone-400">
                      Shop status: {titleCase(shop.status)}
                    </p>
                  )}
                </div>
                <StatusPill>{titleCase(app.status)}</StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-ink px-3 py-1 text-xs font-semibold"
                  onClick={() => setOpenId((current) => (current === app.id ? "" : app.id))}
                >
                  {openId === app.id ? "Hide details" : "Review"}
                </button>
                {app.status !== "approved" && (
                  <>
                    <button
                      type="button"
                      disabled={pending?.id === app.id}
                      className="rounded-full bg-carrot px-3 py-1 text-xs text-white disabled:opacity-60"
                      onClick={() => void setStatus(app.id, app.shopId, "approved")}
                    >
                      {pending?.id === app.id && pending.status === "approved"
                        ? "Approving…"
                        : "Approve shop"}
                    </button>
                    <button
                      type="button"
                      disabled={pending?.id === app.id}
                      className="rounded-full border px-3 py-1 text-xs disabled:opacity-60"
                      onClick={() => void setStatus(app.id, app.shopId, "rejected")}
                    >
                      {pending?.id === app.id && pending.status === "rejected" ? "Rejecting…" : "Reject"}
                    </button>
                    <button
                      type="button"
                      disabled={pending?.id === app.id}
                      className="rounded-full border px-3 py-1 text-xs disabled:opacity-60"
                      onClick={() => void setStatus(app.id, app.shopId, "under_review")}
                    >
                      {pending?.id === app.id && pending.status === "under_review"
                        ? "Saving…"
                        : "Under review"}
                    </button>
                  </>
                )}
              </div>
              {openId === app.id && (
                <div className="mt-4">
                  <ApplicationTracker application={app} mode="admin" />
                </div>
              )}
            </li>
          );
        })}
        {applications.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-sm text-stone-500">
            {statusFilter === "waiting"
              ? "No join requests are waiting."
              : "No join requests match this filter."}
          </li>
        )}
      </ul>
    </div>
  );
}
