"use client";

import { useApp } from "@/context/AppContext";

export default function AdminAdsPage() {
  const { state, dispatch } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Homepage ads</h1>
      <p className="mt-1 text-sm text-stone-500">
        Choose which banners rotate on the buyer dashboard, like Amazon deals.
      </p>
      <ul className="mt-6 space-y-3">
        {state.advertisements.map((ad) => (
          <li key={ad.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
            <div>
              <p className="font-semibold">{ad.title}</p>
              <p className="text-xs text-stone-500">
                {ad.badge} · {ad.href}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ad.active}
                onChange={(e) =>
                  dispatch({ type: "upsertAd", ad: { ...ad, active: e.target.checked } })
                }
              />
              Show on dashboard
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
