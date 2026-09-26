"use client";

import { AddressFields, emptyAddressDraft } from "@/components/address/AddressFields";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAlert } from "@/components/ui/AlertMessage";
import { BlockingLoader } from "@/components/ui/Loader";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import { mapOrder, placeOrderRequest } from "@/lib/api";
import { createId } from "@/lib/ids";
import { useMotionRouter } from "@/lib/motion";
import {
  couponDiscount,
  couponEligibleAmount,
  findCouponTag,
  listingSaleDiscount,
} from "@/lib/tags";
import { formatAddressLine, validatePinCode } from "@/services/auth";
import { cartShipments, cartSummary, deliveryCountLabel } from "@/services/cart";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { clearOfferCheckout, readOfferCheckout } from "@/lib/offerCheckout";

function CheckoutForm() {
  const { state, user, neighborhood, listingById, shopById, catalogById, dispatch } = useApp();
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const searchParams = useSearchParams();
  const pendingOffer = readOfferCheckout();
  const requestId = searchParams.get("requestId") ?? pendingOffer?.requestId ?? undefined;
  const offerId = searchParams.get("offerId") ?? pendingOffer?.offerId ?? undefined;
  const addresses = user?.addresses ?? [];
  const defaultId = user?.defaultAddressId ?? addresses[0]?.id ?? "new";
  const [addressId, setAddressId] = useState(addresses.length ? defaultId : "new");
  const [draft, setDraft] = useState(() => ({
    ...emptyAddressDraft(),
    pinCode: user?.pinCode ?? "",
    line: addresses.length ? "" : `Near ${neighborhood.name}, ${neighborhood.area}`,
  }));
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const shipments = useMemo(
    () =>
      cartShipments({
        cart: state.cart,
        listingById,
        shopById,
        catalogById,
        quickDeliveryEnabled: state.settings.quickDeliveryEnabled,
      }),
    [state.cart, listingById, shopById, catalogById, state.settings.quickDeliveryEnabled],
  );
  const priced = useMemo(() => {
    return shipments.map((shipment) => {
      const saleOff = shipment.lines.reduce(
        (sum, line) => sum + listingSaleDiscount(line.listing, line.item.quantity, state.promoTags),
        0,
      );
      const afterSale = Math.max(0, shipment.subtotal - saleOff);
      const coupon = findCouponTag(state.promoTags, couponCode, shipment.shop.id);
      const eligible = coupon
        ? couponEligibleAmount(
            shipment.lines.map((line) => ({ listing: line.listing, quantity: line.item.quantity })),
            coupon,
          )
        : 0;
      const couponOk = Boolean(coupon?.coupon) && eligible > 0;
      const couponOff = couponOk && coupon.coupon ? couponDiscount(eligible, coupon.coupon) : 0;
      const subtotal = Math.max(0, afterSale - couponOff);
      return {
        shipment,
        saleOff,
        couponOff,
        couponCode: couponOff ? coupon?.code : undefined,
        subtotal,
        total: subtotal + shipment.deliveryFee,
      };
    });
  }, [shipments, state.promoTags, couponCode]);

  const summary = cartSummary(shipments);
  const saleTotal = priced.reduce((sum, row) => sum + row.saleOff, 0);
  const couponTotal = priced.reduce((sum, row) => sum + row.couponOff, 0);
  const payTotal = priced.reduce((sum, row) => sum + row.total, 0);
  const selectedAddress = addresses.find((item) => item.id === addressId);

  if (state.cart.length === 0) {
    return <p className="p-8 text-sm">Cart is empty.</p>;
  }

  function deliveryAddress() {
    if (selectedAddress) return formatAddressLine(selectedAddress);
    return formatAddressLine(draft);
  }

  function validate() {
    if (addressId === "new") {
      if (draft.line.trim().length < 8) return "Enter a full delivery address.";
      const pinError = validatePinCode(draft.pinCode);
      if (pinError) return pinError;
    } else if (!selectedAddress) {
      return "Pick a delivery address.";
    }
    if (couponCode.trim()) {
      const any = priced.some((row) => row.couponOff > 0);
      if (!any) return "This coupon is not valid for these products.";
    }
    return "";
  }

  async function place() {
    if (!user) return;
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setPlacing(true);
    if (addressId === "new" && saveAddress) {
      dispatch({
        type: "saveAddress",
        setDefault: true,
        address: {
          id: createId("addr"),
          label: draft.label.trim() || "Home",
          line: draft.line.trim(),
          pinCode: draft.pinCode.trim(),
          coordinates: draft.coordinates,
        },
      });
    }
    const address = deliveryAddress();
    const addressCoordinates = selectedAddress?.coordinates ?? draft.coordinates;
    for (const row of priced) {
      const shipment = row.shipment;
      const local = {
        id: createId("ORD").toUpperCase(),
        buyerId: user.id,
        shopId: shipment.shop.id,
        items: shipment.lines.map(({ item, listing }, index) => ({
          listingId: listing.id,
          catalogProductId: listing.catalogProductId,
          quantity: item.quantity,
          unitPrice: listing.sellerPrice,
          deliveryMode: shipment.deliveryMode,
          deliveryFee: index === 0 ? shipment.deliveryFee : 0,
          warranty: listing.warranty,
        })),
        deliveryMode: shipment.deliveryMode,
        status: "placed" as const,
        subtotal: row.subtotal,
        deliveryFee: shipment.deliveryFee,
        total: row.total,
        createdAt: new Date().toISOString(),
        address,
        addressCoordinates,
        timeline: [{ status: "placed" as const, at: new Date().toISOString() }],
        discount: row.saleOff + row.couponOff,
        couponCode: row.couponCode,
      };
      try {
        const created = await placeOrderRequest({
          items: shipment.lines.map(({ item, listing }) => ({
            listingId: listing.id,
            quantity: item.quantity,
            deliveryMode: shipment.deliveryMode,
          })),
          address,
          discount: local.discount,
          couponCode: local.couponCode,
          requestId,
          offerId,
        });
        dispatch({
          type: "placeOrder",
          order: { ...mapOrder(created), addressCoordinates },
        });
        if (requestId && offerId) clearOfferCheckout();
      } catch {
        dispatch({ type: "placeOrder", order: local });
      }
    }
    showAlert({
      tone: "success",
      title: "Order placed",
      message: `Arriving in ${deliveryCountLabel(shipments.length)}.`,
      action: { href: "/account/orders", label: "Track orders" },
    });
    router.push("/account/orders");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {placing && <BlockingLoader label="Placing order…" />}
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">Choose a delivery address and place the order.</p>

      <section className="mt-6 rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Delivery address</h2>
        <div className="mt-3 space-y-2">
          {addresses.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors duration-200 ${
                addressId === item.id ? "border-carrot/40 bg-blush/60" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={addressId === item.id}
                onChange={() => setAddressId(item.id)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-stone-500">{formatAddressLine(item)}</span>
              </span>
            </label>
          ))}
          <label
            className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors duration-200 ${
              addressId === "new" ? "border-carrot/40 bg-blush/60" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="address"
              checked={addressId === "new"}
              onChange={() => setAddressId("new")}
              className="mt-1"
            />
            <span className="font-medium">New address</span>
          </label>
        </div>
        {addressId === "new" && (
          <div className="mt-4 animate-fade-in">
            <AddressFields value={draft} onChange={setDraft} />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              Save this address to my account
            </label>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-white p-5">
        <Field label="Coupon code" hint="optional">
          <TextInput
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="HOUSE10"
          />
        </Field>
        <p className="mt-4 font-semibold">Arriving in {deliveryCountLabel(summary.deliveryCount)}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {priced.map((row, index) => (
            <li key={row.shipment.shop.id} className="flex justify-between gap-3">
              <span className="text-stone-600">
                Delivery {index + 1} · {row.shipment.shop.name} · {row.shipment.itemCount} item
                {row.shipment.itemCount === 1 ? "" : "s"}
              </span>
              <span className="font-semibold">{formatInr(row.total)}</span>
            </li>
          ))}
        </ul>
        {saleTotal + couponTotal > 0 && (
          <p className="mt-3 text-sm text-carrot">
            Saved {formatInr(saleTotal + couponTotal)}
            {couponTotal > 0 ? ` · coupon ${formatInr(couponTotal)}` : ""}
          </p>
        )}
        <p className="mt-4 text-lg font-semibold">Total {formatInr(payTotal)}</p>
      </section>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="button"
        disabled={placing}
        onClick={() => void place()}
        className="btn-primary btn-block btn-lg mt-6"
      >
        {placing ? "Placing order…" : `Place order · ${formatInr(payTotal)}`}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="p-8 text-sm text-stone-500">Loading checkout…</p>}>
        <CheckoutForm />
      </Suspense>
    </RequireAuth>
  );
}
