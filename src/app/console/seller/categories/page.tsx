"use client";

import { Field, Select } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { categories } from "@/data/seed";
import { useState } from "react";

export default function SellerCategoriesPage() {
  const { user, state, dispatch } = useApp();
  const [addId, setAddId] = useState("snacks");
  if (!user) return null;
  const shop = state.shops.find((s) => s.ownerUserId === user.id) ?? state.shops.find((s) => s.id === user.shopId);

  if (!shop) return <p>No dukkan profile yet.</p>;

  const available = categories.filter((c) => !shop.categoryIds.includes(c.id));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        {available.length > 0 && (
          <div className="flex items-center gap-2">
            <Field label="">
              <Select value={addId} onChange={(e) => setAddId(e.target.value)}>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "addShopCategory", shopId: shop.id, categoryId: addId })
              }
              className="rounded-full bg-carrot px-4 py-2 text-sm text-white"
            >
              + Add
            </button>
          </div>
        )}
      </div>
      <ul className="mt-6 space-y-2">
        {shop.categoryIds.map((id) => {
          const c = categories.find((x) => x.id === id);
          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
            >
              <span>
                {c?.emoji} {c?.name ?? id}
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "removeShopCategory", shopId: shop.id, categoryId: id })
                }
                className="text-xs text-stone-500"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
