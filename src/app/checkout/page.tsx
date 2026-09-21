"use client";

import { AddressFields, emptyAddressDraft } from "@/components/address/AddressFields";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAlert } from "@/components/ui/AlertMessage";
import { BlockingLoader } from "@/components/ui/Loader";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { cardBrandLabel, createPaymentRefId, formatInr, paymentMethodLabel } from "@/lib/format";
import { mapOrder, placeOrderRequest } from "@/lib/api";
import { createId } from "@/lib/ids";
import { useMotionRouter } from "@/lib/motion";
import {
  couponDiscount,
  couponEligibleAmount,
  couponMatchesPayment,
  findCouponTag,
  listingSaleDiscount,
} from "@/lib/tags";
import type { PaymentMethod, SavedCard } from "@/lib/types";
import { cardBrandFromNumber, formatAddressLine, maskCardNumber, validatePinCode } from "@/services/auth";
import { cartShipments, cartSummary, deliveryCountLabel } from "@/services/cart";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { clearOfferCheckout, readOfferCheckout } from "@/lib/offerCheckout";

const METHODS: { id: PaymentMethod; title: string; hint: string }[] = [
  { id: "upi", title: "UPI", hint: "GPay, PhonePe, Paytm" },
  { id: "credit_card", title: "Credit card", hint: "Visa, Mastercard, RuPay — full card details" },
  { id: "debit_card", title: "Debit card", hint: "Visa, Mastercard, RuPay" },
  { id: "wallet", title: "Wallet", hint: "Paytm, Amazon Pay, PhonePe" },
  { id: "net_banking", title: "Net banking", hint: "All major banks" },
  { id: "cod", title: "Cash on delivery", hint: "Pay when it arrives" },
];

const BANKS = ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak", "Yes Bank"];

function preferredMethod(method?: PaymentMethod): PaymentMethod {
  if (method === "card") return "credit_card";
  return method ?? "upi";
}

function isCardMethod(method: PaymentMethod) {
  return method === "card" || method === "credit_card" || method === "debit_card";
}

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
  const [method, setMethod] = useState<PaymentMethod>(preferredMethod(user?.preferredPayment));
  const [upiId, setUpiId] = useState(user?.savedUpiId ?? "");
  const [saveUpi, setSaveUpi] = useState(Boolean(user?.savedUpiId));
  const [cardName, setCardName] = useState(user?.name ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [walletId, setWalletId] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [couponCode, setCouponCode] = useState("");
  const cards = user?.cards ?? [];
  const [cardId, setCardId] = useState(cards.length ? (user?.defaultCardId ?? cards[0]?.id ?? "new") : "new");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const shipments = useMemo(
    () =>
      cartShipments({
        cart: state.cart,
        listingById,
        shopById,
        catalogById,
      }),
    [state.cart, listingById, shopById, catalogById],
  );
  const selectedCard: SavedCard | undefined =
    cardId === "new"
      ? {
          id: "new",
          brand: cardBrandFromNumber(cardNumber),
          last4: maskCardNumber(cardNumber),
          expiry: cardExpiry,
          name: cardName,
        }
      : cards.find((card) => card.id === cardId);

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
      const couponOk =
        coupon?.coupon &&
        eligible > 0 &&
        couponMatchesPayment(coupon.coupon, method, selectedCard);
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
  }, [shipments, state.promoTags, couponCode, method, selectedCard]);

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
    if (method === "upi") {
      if (!/^[\w.-]{2,}@[\w.-]{2,}$/.test(upiId.trim())) return "Enter a valid UPI ID.";
    }
    if (isCardMethod(method)) {
      if (cardId !== "new") {
        if (!cards.some((card) => card.id === cardId)) return "Pick a saved card.";
      } else {
        const number = cardNumber.replace(/\s/g, "");
        if (number.length < 12) return "Enter your card number.";
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) return "Enter expiry as MM/YY.";
        if (cardName.trim().length < 2) return "Enter the name on the card.";
      }
      if (cardCvv.trim().length < 3) return "Enter the CVV.";
    }
    if (method === "wallet" && walletId.trim().length < 4) return "Enter your wallet ID or phone.";
    if (couponCode.trim()) {
      const any = priced.some((row) => row.couponOff > 0);
      if (!any) return "This coupon is not valid for the selected payment method or products.";
    }
    return "";
  }

  async function pay() {
    if (!user) return;
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setPaying(true);
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
    if (method === "upi" && saveUpi) {
      dispatch({ type: "setPaymentPrefs", preferredPayment: "upi", savedUpiId: upiId.trim() });
    } else if (isCardMethod(method) && cardId === "new" && saveCard) {
      dispatch({
        type: "saveCard",
        setDefault: true,
        card: {
          id: createId("card"),
          brand: cardBrandFromNumber(cardNumber),
          last4: maskCardNumber(cardNumber),
          expiry: cardExpiry.trim(),
          name: cardName.trim(),
        },
      });
    } else {
      dispatch({ type: "setPaymentPrefs", preferredPayment: method });
    }

    if (method !== "cod") {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
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
        paymentMethod: method,
        paymentStatus: method === "cod" ? ("cod" as const) : ("paid" as const),
        paymentRefId: createPaymentRefId(method),
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
          paymentMethod: method,
          paymentStatus: local.paymentStatus,
          paymentRefId: local.paymentRefId,
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
      title: method === "cod" ? "Order placed" : "Payment successful",
      message: `Arriving in ${deliveryCountLabel(shipments.length)} · ${paymentMethodLabel(method)}`,
      action: { href: "/account/orders", label: "Track orders" },
    });
    router.push("/account/orders");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {paying && <BlockingLoader label="Processing payment…" />}
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">
        Choose an address and pay. Card and UPI are simulated in this demo.
      </p>

      <section className="mt-6 rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Delivery address</h2>
        <div className="mt-3 space-y-2">
          {addresses.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors duration-200 ${
                addressId === item.id ? "border-ink bg-lime/20" : "border-stone-200"
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
              addressId === "new" ? "border-ink bg-lime/20" : "border-stone-200"
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

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Payment</h2>
        <div className="mt-3 space-y-2">
          {METHODS.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors duration-200 ${
                method === item.id ? "border-ink bg-lime/20" : "border-stone-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={method === item.id}
                onChange={() => setMethod(item.id)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{item.title}</span>
                <span className="mt-0.5 block text-stone-500">{item.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {method === "upi" && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <Field label="UPI ID">
              <TextInput
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@okaxis"
                autoComplete="off"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saveUpi} onChange={(e) => setSaveUpi(e.target.checked)} />
              Remember this UPI ID
            </label>
          </div>
        )}

        {isCardMethod(method) && (
          <div className="mt-4 space-y-2 animate-fade-in">
            {cards.map((card) => (
              <label
                key={card.id}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors duration-200 ${
                  cardId === card.id ? "border-ink bg-lime/20" : "border-stone-200"
                }`}
              >
                <input
                  type="radio"
                  name="card"
                  checked={cardId === card.id}
                  onChange={() => setCardId(card.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">
                    {cardBrandLabel(card.brand)} · •••• {card.last4}
                  </span>
                  <span className="mt-0.5 block text-stone-500">
                    {card.name} · {card.expiry}
                  </span>
                </span>
              </label>
            ))}
            <label
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors duration-200 ${
                cardId === "new" ? "border-ink bg-lime/20" : "border-stone-200"
              }`}
            >
              <input
                type="radio"
                name="card"
                checked={cardId === "new"}
                onChange={() => setCardId("new")}
                className="mt-1"
              />
              <span className="font-medium">
                New {method === "debit_card" ? "debit" : "credit"} card
              </span>
            </label>
            {cardId === "new" && (
              <div className="grid gap-3 pt-2 sm:grid-cols-2 animate-fade-in">
                <div className="sm:col-span-2">
                  <Field label="Name on card">
                    <TextInput value={cardName} onChange={(e) => setCardName(e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Card number">
                    <TextInput
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "),
                        )
                      }
                      placeholder="XXXX XXXX XXXX XXXX"
                    />
                  </Field>
                </div>
                <Field label="Expiry">
                  <TextInput
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                    }}
                  />
                </Field>
                <Field label="CVV">
                  <TextInput
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                  Save this card to my profile
                </label>
              </div>
            )}
            {cardId !== "new" && (
              <Field label="CVV">
                <TextInput
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </Field>
            )}
          </div>
        )}

        {method === "wallet" && (
          <div className="mt-4 animate-fade-in">
            <Field label="Wallet ID or phone">
              <TextInput
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                placeholder="98765 43210"
              />
            </Field>
          </div>
        )}

        {method === "net_banking" && (
          <div className="mt-4 animate-fade-in">
            <Field label="Bank">
              <Select value={bank} onChange={(e) => setBank(e.target.value)}>
                {BANKS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        <div className="mt-4">
          <Field label="Coupon code" hint="optional">
            <TextInput
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="HOUSE10"
            />
          </Field>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="font-semibold">Arriving in {deliveryCountLabel(summary.deliveryCount)}</p>
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
          <p className="mt-3 text-sm text-teal-800">
            Saved {formatInr(saleTotal + couponTotal)}
            {couponTotal > 0 ? ` · coupon ${formatInr(couponTotal)}` : ""}
          </p>
        )}
        <p className="mt-4 text-lg font-semibold">Total {formatInr(payTotal)}</p>
      </section>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="button"
        disabled={paying}
        onClick={() => void pay()}
        className="mt-6 w-full rounded-full bg-ink py-3 font-semibold text-lime disabled:opacity-60"
      >
        {paying
          ? "Processing…"
          : method === "cod"
            ? `Place order · ${formatInr(payTotal)}`
            : `Pay ${formatInr(payTotal)}`}
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
