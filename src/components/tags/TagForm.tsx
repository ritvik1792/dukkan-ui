"use client";

import { Field, Select, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { CARD_NETWORKS, COUPON_PAY_METHODS } from "@/lib/tags";
import type {
  CardBrand,
  CouponPayMethod,
  DiscountType,
  PromoTag,
  TagKind,
} from "@/lib/types";
import { useMemo, useState } from "react";

export function blankTagForm(kind: TagKind = "sale"): TagFormValue {
  return {
    label: "",
    kind,
    code: "",
    saleMin: 99,
    salePercent: 10,
    saleMax: 50,
    couponMin: 99,
    couponMax: 80,
    discountType: "percent",
    discountValue: 10,
    paymentMethods: ["upi"],
    cardNetworks: ["visa", "mastercard", "rupay"],
    cardBanks: "",
    listingIds: [],
  };
}

export type TagFormValue = {
  label: string;
  kind: TagKind;
  code: string;
  saleMin: number;
  salePercent: number;
  saleMax: number;
  couponMin: number;
  couponMax: number;
  discountType: DiscountType;
  discountValue: number;
  paymentMethods: CouponPayMethod[];
  cardNetworks: CardBrand[];
  cardBanks: string;
  listingIds: string[];
};

export function tagToForm(tag: PromoTag): TagFormValue {
  return {
    label: tag.label,
    kind: tag.kind,
    code: tag.code ?? "",
    saleMin: tag.sale?.minAmount ?? 99,
    salePercent: tag.sale?.discountPercent ?? 10,
    saleMax: tag.sale?.maxDiscount ?? 50,
    couponMin: tag.coupon?.minPrice ?? 99,
    couponMax: tag.coupon?.maxDiscount ?? 80,
    discountType: tag.coupon?.discountType ?? "percent",
    discountValue: tag.coupon?.discountValue ?? 10,
    paymentMethods: tag.coupon?.paymentMethods ?? ["upi"],
    cardNetworks: tag.coupon?.creditCard?.networks ?? ["visa", "mastercard", "rupay"],
    cardBanks: tag.coupon?.creditCard?.banks ?? "",
    listingIds: tag.listingIds,
  };
}

export function formToTag(
  form: TagFormValue,
  base: Pick<PromoTag, "id" | "owner" | "shopId" | "createdByUserId" | "status" | "createdAt">,
): PromoTag {
  return {
    ...base,
    label: form.label.trim(),
    kind: form.kind,
    code: form.kind === "coupon" ? form.code.trim().toUpperCase() || undefined : form.code.trim() || undefined,
    sale:
      form.kind === "sale"
        ? {
            minAmount: Math.max(0, form.saleMin),
            discountPercent: Math.max(0, form.salePercent),
            maxDiscount: Math.max(0, form.saleMax),
          }
        : undefined,
    coupon:
      form.kind === "coupon"
        ? {
            minPrice: Math.max(0, form.couponMin),
            maxDiscount: Math.max(0, form.couponMax),
            discountType: form.discountType,
            discountValue: Math.max(0, form.discountValue),
            paymentMethods: form.paymentMethods,
            creditCard: form.paymentMethods.includes("credit_card")
              ? { networks: form.cardNetworks, banks: form.cardBanks.trim() }
              : undefined,
          }
        : undefined,
    listingIds: form.listingIds,
  };
}

export function TagForm({
  initial,
  shopId,
  lockRules,
  submitLabel,
  onSubmit,
}: {
  initial?: TagFormValue;
  shopId?: string;
  lockRules?: boolean;
  submitLabel: string;
  onSubmit: (value: TagFormValue) => void;
}) {
  const { state, catalogById, shopById } = useApp();
  const [form, setForm] = useState<TagFormValue>(initial ?? blankTagForm());
  const [query, setQuery] = useState("");

  function set<K extends keyof TagFormValue>(key: K, value: TagFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const listings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.listings.filter((listing) => {
      if (shopId && listing.shopId !== shopId) return false;
      if (!q) return true;
      const product = catalogById(listing.catalogProductId);
      const shop = shopById(listing.shopId);
      return `${product?.name ?? ""} ${product?.brand ?? ""} ${shop?.name ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [state.listings, shopId, query, catalogById, shopById]);

  function toggleListing(id: string) {
    setForm((current) => ({
      ...current,
      listingIds: current.listingIds.includes(id)
        ? current.listingIds.filter((item) => item !== id)
        : [...current.listingIds, id],
    }));
  }

  function togglePay(method: CouponPayMethod) {
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(method)
        ? current.paymentMethods.filter((item) => item !== method)
        : [...current.paymentMethods, method],
    }));
  }

  function toggleNetwork(network: CardBrand) {
    setForm((current) => ({
      ...current,
      cardNetworks: current.cardNetworks.includes(network)
        ? current.cardNetworks.filter((item) => item !== network)
        : [...current.cardNetworks, network],
    }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.label.trim()) return;
        if (form.kind === "coupon" && !form.code.trim()) return;
        onSubmit(form);
      }}
    >
      <Field label="Name">
        <TextInput
          required
          value={form.label}
          disabled={lockRules}
          onChange={(event) => set("label", event.target.value)}
          placeholder="Weekend sale, HOUSE10…"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select
            value={form.kind}
            disabled={lockRules}
            onChange={(event) => set("kind", event.target.value as TagKind)}
          >
            <option value="sale">Sale</option>
            <option value="coupon">Coupon</option>
            <option value="offer">Offer</option>
            <option value="badge">Badge</option>
          </Select>
        </Field>
        <Field label="Code" hint={form.kind === "coupon" ? "required" : "optional"}>
          <TextInput
            required={form.kind === "coupon"}
            disabled={lockRules}
            value={form.code}
            onChange={(event) => set("code", event.target.value.toUpperCase())}
            placeholder="SAVE10"
          />
        </Field>
      </div>

      {form.kind === "sale" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Min amount ₹">
            <TextInput
              type="number"
              min={0}
              disabled={lockRules}
              value={form.saleMin}
              onChange={(event) => set("saleMin", Number(event.target.value))}
            />
          </Field>
          <Field label="Discount %">
            <TextInput
              type="number"
              min={0}
              max={100}
              disabled={lockRules}
              value={form.salePercent}
              onChange={(event) => set("salePercent", Number(event.target.value))}
            />
          </Field>
          <Field label="Max discount ₹">
            <TextInput
              type="number"
              min={0}
              disabled={lockRules}
              value={form.saleMax}
              onChange={(event) => set("saleMax", Number(event.target.value))}
            />
          </Field>
        </div>
      )}

      {form.kind === "coupon" && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Min price ₹">
              <TextInput
                type="number"
                min={0}
                disabled={lockRules}
                value={form.couponMin}
                onChange={(event) => set("couponMin", Number(event.target.value))}
              />
            </Field>
            <Field label="Max discount ₹">
              <TextInput
                type="number"
                min={0}
                disabled={lockRules}
                value={form.couponMax}
                onChange={(event) => set("couponMax", Number(event.target.value))}
              />
            </Field>
            <Field label="Discount type">
              <Select
                disabled={lockRules}
                value={form.discountType}
                onChange={(event) => set("discountType", event.target.value as DiscountType)}
              >
                <option value="percent">Percent</option>
                <option value="flat">Flat ₹</option>
              </Select>
            </Field>
            <Field label={form.discountType === "percent" ? "Percent off" : "Flat off ₹"}>
              <TextInput
                type="number"
                min={0}
                disabled={lockRules}
                value={form.discountValue}
                onChange={(event) => set("discountValue", Number(event.target.value))}
              />
            </Field>
          </div>
          <div>
            <p className="text-sm font-medium">Payment methods</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COUPON_PAY_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    form.paymentMethods.includes(method.id)
                      ? "border-ink bg-lime/40"
                      : "border-stone-200 bg-white"
                  } ${lockRules ? "opacity-70" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    disabled={lockRules}
                    checked={form.paymentMethods.includes(method.id)}
                    onChange={() => togglePay(method.id)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>
          {form.paymentMethods.includes("credit_card") && (
            <div className="rounded-2xl border border-stone-200 p-3">
              <p className="text-sm font-semibold">Credit card rules</p>
              <p className="mt-1 text-xs text-stone-500">
                Restrict this coupon to card networks and issuing banks.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CARD_NETWORKS.map((network) => (
                  <label
                    key={network.id}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      form.cardNetworks.includes(network.id)
                        ? "border-ink bg-lime/40"
                        : "border-stone-200 bg-white"
                    } ${lockRules ? "opacity-70" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      disabled={lockRules}
                      checked={form.cardNetworks.includes(network.id)}
                      onChange={() => toggleNetwork(network.id)}
                    />
                    {network.label}
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Field label="Issuing banks" hint="optional, comma separated">
                  <TextInput
                    disabled={lockRules}
                    value={form.cardBanks}
                    onChange={(event) => set("cardBanks", event.target.value)}
                    placeholder="HDFC, SBI, ICICI"
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold">Attached products</p>
        <p className="mt-0.5 text-xs text-stone-500">
          Add or remove products now. You can change this after the tag is saved.
        </p>
        <div className="mt-2">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
          />
        </div>
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2">
          {listings.map((listing) => {
            const product = catalogById(listing.catalogProductId);
            const shop = shopById(listing.shopId);
            const checked = form.listingIds.includes(listing.id);
            return (
              <li key={listing.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-stone-50">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggleListing(listing.id)}
                  />
                  <span>
                    <span className="font-medium">{product?.name ?? listing.id}</span>
                    <span className="mt-0.5 block text-xs text-stone-400">
                      {product?.brand ?? ""}
                      {shop && !shopId ? ` · ${shop.name}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
          {listings.length === 0 && (
            <li className="px-2 py-4 text-center text-sm text-stone-500">No products match.</li>
          )}
        </ul>
        {form.listingIds.length > 0 && (
          <p className="mt-2 text-xs text-stone-500">{form.listingIds.length} product(s) attached.</p>
        )}
      </div>

      <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-lime">
        {submitLabel}
      </button>
      {lockRules && (
        <p className="text-xs text-stone-500">
          Platform tag rules stay with admin. You can still attach or remove your products.
        </p>
      )}
    </form>
  );
}
