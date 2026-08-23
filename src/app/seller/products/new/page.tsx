"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useApp } from "@/context/AppContext";
import { categories } from "@/lib/mock-data";
import type { DeliveryMode, Product } from "@/lib/types";

export default function NewProductPage() {
  const { user, state, dispatch } = useApp();
  const router = useRouter();
  const shops = state.shops.filter(
    (s) => s.ownerUserId === user.id || user.role === "admin",
  );
  const [shopId, setShopId] = useState(user.shopId ?? shops[0]?.id ?? "");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("grocery");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(99);
  const [mrp, setMrp] = useState(120);
  const [unit, setUnit] = useState("1 pc");
  const [stock, setStock] = useState(10);
  const [moq, setMoq] = useState(1);
  const [modes, setModes] = useState<DeliveryMode[]>(["partner", "shop"]);
  const [preview, setPreview] = useState<string | null>(null);

  function toggleMode(mode: DeliveryMode) {
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!shopId || !name || modes.length === 0) return;
    const product: Product = {
      id: `p-${Date.now()}`,
      shopId,
      name,
      brand: brand || "Unbranded",
      category,
      description,
      price,
      mrp: Math.max(mrp, price),
      unit,
      stock,
      rating: 0,
      reviews: 0,
      imageLabel: name.slice(0, 8),
      imageHue: Math.floor(Math.random() * 360),
      moq,
      status: "pending",
      deliveryModes: modes,
    };
    dispatch({ type: "addProduct", product });
    router.push("/seller/products");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Upload product</h1>
      <p className="mt-1 text-sm text-stone-500">
        Catalogue form inspired by Amazon + IndiaMART. Admin approval is required before
        it appears nearby.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Shop">
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          />
        </Field>
        <Field label="Brand">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price ₹">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </Field>
          <Field label="MRP ₹">
            <input
              type="number"
              value={mrp}
              onChange={(e) => setMrp(Number(e.target.value))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </Field>
          <Field label="Unit">
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
            />
          </Field>
          <Field label="Stock">
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full rounded-xl border px-3 py-2"
            />
          </Field>
        </div>
        <Field label="Minimum order qty">
          <input
            type="number"
            min={1}
            value={moq}
            onChange={(e) => setMoq(Number(e.target.value))}
            className="w-full rounded-xl border px-3 py-2"
          />
        </Field>
        <div>
          <p className="text-sm font-medium">Delivery</p>
          <div className="mt-2 flex gap-3">
            {(["partner", "shop"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={modes.includes(m)}
                  onChange={() => toggleMode(m)}
                />
                {m === "partner" ? "Dukkan partner" : "Shop itself"}
              </label>
            ))}
          </div>
        </div>
        <Field label="Photo (preview only, stored locally)">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="mt-2 h-28 rounded-xl object-cover" />
          )}
        </Field>
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-lime"
        >
          Submit for approval
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}
