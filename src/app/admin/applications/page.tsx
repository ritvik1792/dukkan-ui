"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";

export default function AdminApplications() {
  const { state, dispatch } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Join requests</h1>
      <ul className="mt-6 space-y-3">
        {state.applications.map((app) => (
          <li key={app.id} className="rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{app.businessName}</p>
                <p className="text-sm text-stone-500">
                  {app.ownerName} · {app.email} · {app.phone}
                </p>
                <p className="mt-1 text-sm">{app.address}</p>
                <p className="text-xs text-stone-400">{formatDate(app.submittedAt)}</p>
              </div>
              <StatusPill>{titleCase(app.status)}</StatusPill>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                onClick={() => {
                  dispatch({
                    type: "setApplicationStatus",
                    applicationId: app.id,
                    status: "approved",
                  });
                  dispatch({ type: "setShopStatus", shopId: app.shopId, status: "active" });
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() =>
                  dispatch({
                    type: "setApplicationStatus",
                    applicationId: app.id,
                    status: "rejected",
                  })
                }
              >
                Reject
              </button>
              <button
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() =>
                  dispatch({
                    type: "setApplicationStatus",
                    applicationId: app.id,
                    status: "under_review",
                  })
                }
              >
                Under review
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
