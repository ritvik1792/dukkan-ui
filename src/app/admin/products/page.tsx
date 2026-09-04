"use client";

import { useApp } from "@/context/AppContext";

export default function AdminProducts() {
  const { state, dispatch, shopById, catalogById } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Listing moderation</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Dukkan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {state.listings.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="px-4 py-3">{catalogById(l.catalogProductId)?.name}</td>
                <td className="px-4 py-3">{shopById(l.shopId)?.name}</td>
                <td className="px-4 py-3 capitalize">{l.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "setListingStatus",
                          listingId: l.id,
                          status: "approved",
                        })
                      }
                      className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: "setListingStatus",
                          listingId: l.id,
                          status: "rejected",
                        })
                      }
                      className="rounded-full border px-3 py-1 text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
