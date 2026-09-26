"use client";

import {
  SellerIntentFields,
  emptySellerIntent,
  isSelling,
  sellerIntentError,
  type SellerIntentValues,
} from "@/components/auth/SellerIntentFields";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { createApplicationRequest, mapApplication, mapShop, patchShopRequest } from "@/lib/api";
import { isStaffRole, ROUTES, sellerConsolePath } from "@/lib/routes";
import { useMotionRouter } from "@/lib/motion";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

function SellApplyForm() {
  const { user, state, dispatch, locationLabel } = useApp();
  const router = useMotionRouter();
  const shop =
    state.shops.find((item) => item.id === user?.shopId) ??
    state.shops.find((item) => item.ownerUserId === user?.id);
  const existing = state.applications.find((a) => a.userId === user?.id);
  const adding = Boolean(shop);
  const [ownerName, setOwnerName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [intent, setIntent] = useState<SellerIntentValues>(emptySellerIntent());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setIntent((current) => ({
      ...current,
      businessName: current.businessName || shop.name,
      address: current.address || shop.address,
      serviceArea: current.serviceArea || shop.serviceArea || "",
      profession: current.profession || shop.profession || "",
    }));
  }, [shop]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!isSelling(intent)) {
      setError("Select shop categories and/or I provide services.");
      return;
    }
    const intentError = sellerIntentError(intent, !adding);
    if (intentError) {
      setError(intentError);
      return;
    }
    setBusy(true);
    setError("");
    const origin = intent.pin?.coordinates;
    try {
      if (adding && shop) {
        const categoryIds = Array.from(
          new Set([
            ...shop.categoryIds,
            ...intent.productCategoryIds,
            ...(intent.provideServices ? intent.serviceCategoryIds : []),
          ]),
        );
        const raw = await patchShopRequest(shop.id, {
          categoryIds,
          serviceArea: intent.serviceArea.trim() || undefined,
          profession: intent.profession.trim() || undefined,
        });
        dispatch({ type: "upsertShop", shop: mapShop(raw) });
        router.push(sellerConsolePath("/categories"));
        return;
      }
      const created = await createApplicationRequest({
        businessName: intent.businessName.trim(),
        ownerName: ownerName.trim() || user.name,
        email: email.trim() || user.email,
        phone: phone.trim() || user.phone || "",
        address: intent.address.trim(),
        gstin: intent.gstin.trim() || undefined,
        categoryIds: intent.productCategoryIds,
        serviceCategoryIds: intent.provideServices ? intent.serviceCategoryIds : [],
        provideServices: intent.provideServices,
        providerType: intent.provideServices
          ? intent.productCategoryIds.length > 0
            ? "PRODUCT_BUSINESS"
            : intent.providerType
          : undefined,
        profession: intent.profession.trim() || undefined,
        serviceArea: intent.serviceArea.trim() || undefined,
        notes: intent.notes.trim() || undefined,
        partnerDeliveryEnabled: intent.partnerDelivery,
        shopDeliveryEnabled: intent.shopDelivery,
        lat: origin?.lat,
        lng: origin?.lng,
      });
      dispatch({ type: "upsertShop", shop: mapShop(created.shop) });
      dispatch({ type: "addApplication", application: mapApplication(created.application) });
      dispatch({
        type: "upsertUser",
        user: {
          ...user,
          name: ownerName.trim() || user.name,
          email: email.trim() || user.email,
          phone: phone.trim() || user.phone,
          role: "seller",
          shopId: created.shop.id,
        },
      });
      router.push(sellerConsolePath("/application"));
  } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">{adding ? "Add categories or services" : "Sell on Pink Carrot"}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {adding
          ? "Add product categories or service offerings to your existing profile. Bookings go live after admin review."
          : "One application for products, services, or both. Track approval from the console."}
      </p>
      {existing && !adding && (
        <p className="mt-3 text-sm">
          You already applied.
          {isStaffRole(user?.role) && (
            <>
              {" "}
              <Link href={ROUTES.consoleDashboard} className="underline">
                Track status in Console
              </Link>
            </>
          )}
        </p>
      )}
      {adding && (
        <p className="mt-3 text-sm text-stone-500">
          Current categories:{" "}
          {shop?.categoryIds
            .map((id) => state.categories.find((c) => c.id === id)?.name ?? id)
            .join(", ") || "none yet"}
          .{" "}
          <Link href={sellerConsolePath("/categories")} className="underline">
            Manage in console
          </Link>
        </p>
      )}
      <form onSubmit={submit} className="mt-8 space-y-4">
        {!adding && (
          <>
            <Field label="Owner name">
              <TextInput required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </>
        )}
        <SellerIntentFields
          categories={state.categories}
          values={intent}
          onChange={setIntent}
          locationLabel={locationLabel}
          mode={adding ? "add" : "apply"}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-carrot px-5 py-2.5 text-sm font-semibold text-white"
        >
          {busy ? "Saving…" : adding ? "Add to my profile" : "Submit application"}
        </button>
      </form>
    </>
  );
}

export default function SellApplyPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-xl px-4 py-10">
        <SellApplyForm />
      </div>
    </RequireAuth>
  );
}
