"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { LocationCapture } from "@/components/location/LocationCapture";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { createApplicationRequest, mapApplication, mapShop } from "@/lib/api";
import { createId } from "@/lib/ids";
import type { Coordinates, SellerApplication, Shop } from "@/lib/types";
import { useMotionRouter } from "@/lib/motion";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { FormEvent, useState } from "react";

function SellForm() {
  const { user, state, dispatch, origin: shopperOrigin, locationLabel } = useApp();
  const categories = state.categories;
  const neighborhoods = state.neighborhoods;
  const router = useMotionRouter();
  const existing = state.applications.find((a) => a.userId === user?.id);

  const [ownerName, setOwnerName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [categoryId, setCategoryId] = useState("grocery");
  const [notes, setNotes] = useState("");
  const [partner, setPartner] = useState(true);
  const [shopDelivery, setShopDelivery] = useState(true);
  const [pin, setPin] = useState<{ coordinates: Coordinates; accuracyM?: number } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const shopId = createId("shop");
    // Prefer the pin the seller dropped at the shop; fall back to wherever they are browsing from.
    const origin =
      pin?.coordinates ?? shopperOrigin ?? neighborhoods[0]?.coordinates ?? { lat: 28.6328, lng: 77.2197 };
    const shop: Shop = {
      id: shopId,
      name: businessName,
      ownerUserId: user.id,
      categoryIds: [categoryId],
      description: notes || `${businessName} on Dukkan`,
      address,
      coordinates: origin,
      rating: 0,
      reviews: 0,
      verified: Boolean(gstin),
      gstin: gstin || undefined,
      yearStarted: new Date().getFullYear(),
      status: "pending",
      partnerDeliveryEnabled: partner,
      shopDeliveryEnabled: shopDelivery,
      partnerDeliveryFee: 25,
      shopDeliveryFee: 15,
      minOrderAmount: 99,
      employees: [],
      transport: [],
    };
    const application: SellerApplication = {
      id: createId("app"),
      userId: user.id,
      shopId,
      status: "submitted",
      businessName,
      ownerName,
      email,
      phone,
      address,
      coordinates: origin,
      gstin,
      categoryIds: [categoryId],
      notes,
      submittedAt: new Date().toISOString(),
    };
    try {
      const created = await createApplicationRequest({
        businessName,
        ownerName,
        email,
        phone,
        address,
        gstin,
        categoryIds: [categoryId],
        notes,
        partnerDeliveryEnabled: partner,
        shopDeliveryEnabled: shopDelivery,
        lat: origin.lat,
        lng: origin.lng,
      });
      dispatch({ type: "upsertShop", shop: mapShop(created.shop) });
      dispatch({ type: "addApplication", application: mapApplication(created.application) });
      dispatch({
        type: "upsertUser",
        user: {
          ...user,
          name: ownerName,
          email,
          phone,
          role: "seller",
          shopId: created.shop.id,
        },
      });
    } catch {
      dispatch({
        type: "upsertUser",
        user: { ...user, name: ownerName, email, phone, role: "seller", shopId },
      });
      dispatch({ type: "upsertShop", shop });
      dispatch({ type: "addApplication", application });
    }
    router.push(ROUTES.consoleDashboard);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Open a dukkan</h1>
      <p className="mt-2 text-sm text-stone-500">
        Apply once. We create a seller profile. Track approval from the console.
      </p>
      {existing && (
        <p className="mt-3 text-sm">
          You already applied.{" "}
          <Link href={ROUTES.consoleDashboard} className="underline">
            Track status in Console
          </Link>
        </p>
      )}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Owner name">
          <TextInput required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </Field>
        <Field label="Email">
          <TextInput required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <TextInput required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Shop name">
          <TextInput required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </Field>
        <Field label="Address">
          <TextArea required value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        </Field>
        <Field
          label="Shop location"
          hint={pin ? "GPS pinned" : `defaults to ${locationLabel}`}
        >
          <LocationCapture
            label="Stand at your shop and pin it"
            hint="Buyers only see dukkans inside their delivery radius, so an accurate pin brings you more orders."
            value={pin?.coordinates}
            accuracyM={pin?.accuracyM}
            onCapture={(coordinates, accuracyM, resolved) => {
              setPin({ coordinates, accuracyM });
              if (resolved?.formattedAddress) setAddress(resolved.formattedAddress);
            }}
            onClear={() => setPin(null)}
          />
        </Field>
        <Field label="GSTIN" hint="optional">
          <TextInput value={gstin} onChange={(e) => setGstin(e.target.value)} />
        </Field>
        <Field label="Primary category">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={partner} onChange={(e) => setPartner(e.target.checked)} />
            Dukkan partner delivery
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shopDelivery}
              onChange={(e) => setShopDelivery(e.target.checked)}
            />
            Deliver ourselves
          </label>
        </div>
        <Field label="About the shop">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
        <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-lime">
          Submit application
        </button>
      </form>
    </div>
  );
}

export default function SellApplyPage() {
  return (
    <RequireAuth>
      <SellForm />
    </RequireAuth>
  );
}
