"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { createId } from "@/lib/ids";
import { FormEvent, useState } from "react";

export default function SellerPromosPage() {
  const { user, state, dispatch } = useApp();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [pct, setPct] = useState(10);
  const [min, setMin] = useState(99);
  if (!user) return null;
  const shop =
    state.shops.find((s) => s.id === user.shopId) ??
    state.shops.find((s) => s.ownerUserId === user.id);
  const coupons = state.coupons.filter((c) => shop && c.shopId === shop.id);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!shop || !code) return;
    dispatch({
      type: "upsertCoupon",
      coupon: {
        id: createId("cpn"),
        shopId: shop.id,
        code: code.toUpperCase(),
        label,
        discountPercent: pct,
        minOrderAmount: min,
        active: true,
      },
    });
    setCode("");
    setLabel("");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Sales & coupons</h1>
      <p className="mt-1 text-sm text-stone-500">
        Shop-wide coupons. Product-level sale tags live on each product.
      </p>
      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
        <Field label="Code">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} required />
        </Field>
        <Field label="Label">
          <TextInput value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="% off">
          <TextInput type="number" value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        </Field>
        <Field label="Min order ₹">
          <TextInput type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </Field>
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-lime sm:col-span-2">
          Add coupon
        </button>
      </form>
      <ul className="mt-6 space-y-2">
        {coupons.map((c) => (
          <li key={c.id} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm">
            <span>
              <strong>{c.code}</strong> · {c.label} · {c.discountPercent}% off over ₹
              {c.minOrderAmount}
            </span>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "upsertCoupon", coupon: { ...c, active: !c.active } })
              }
            >
              {c.active ? "Active" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
