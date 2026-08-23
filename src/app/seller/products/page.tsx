"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function SellerProducts() {
  const { user, state } = useApp();
  const shopIds = new Set(
    state.shops
      .filter((s) => s.ownerUserId === user.id || user.role === "admin")
      .map((s) => s.id),
  );
  const products = state.products.filter((p) => shopIds.has(p.shopId));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/seller/products/new"
          className="rounded-full bg-ink px-4 py-2 text-sm text-lime"
        >
          Upload
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/product/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">₹{p.price}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
                <td className="px-4 py-3">{p.deliveryModes.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
