"use client";

import { TagBadge } from "@/components/TagBadge";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import Link from "next/link";

export default function SellerProducts() {
  const { user, state, catalogById } = useApp();
  if (!user) return null;
  const shopIds = new Set(
    state.shops
      .filter((s) => s.ownerUserId === user.id || user.role === "admin")
      .map((s) => s.id),
  );
  const products = state.listings.filter((l) => shopIds.has(l.shopId));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/seller/products/new"
          className="rounded-full bg-ink px-4 py-2 text-sm text-lime"
        >
          + Add product
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((l) => {
              const p = catalogById(l.catalogProductId);
              return (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/seller/products/${l.id}`} className="font-medium hover:underline">
                      {p?.name}
                    </Link>
                    <p className="text-xs text-stone-400">
                      {l.color || l.quality
                        ? [l.color, l.quality].filter(Boolean).join(" · ")
                        : p?.unit}
                    </p>
                  </td>
                  <td className="px-4 py-3">{formatInr(l.basePrice)}</td>
                  <td className="px-4 py-3">{formatInr(l.sellerPrice)}</td>
                  <td className="px-4 py-3">{l.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {l.tags.map((t) => (
                        <TagBadge key={t.id} tag={t} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{l.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
