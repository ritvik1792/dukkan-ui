"use client";

import { AddressFields, emptyAddressDraft } from "@/components/address/AddressFields";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAlert } from "@/components/ui/AlertMessage";
import { BlockingLoader } from "@/components/ui/Loader";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { cardBrandLabel, formatInr, paymentMethodLabel } from "@/lib/format";
import { createId } from "@/lib/ids";
import { useMotionRouter } from "@/lib/motion";
import type { PaymentMethod } from "@/lib/types";
import { cardBrandFromNumber, formatAddressLine, maskCardNumber, validatePinCode } from "@/services/auth";
import { cartShipments, cartSummary, deliveryCountLabel } from "@/services/cart";
import { useMemo, useState } from "react";

const METHODS: { id: PaymentMethod; title: string; hint: string }[] = [
  { id: "upi", title: "UPI", hint: "GPay, PhonePe, Paytm" },
  { id: "card", title: "Debit / credit card", hint: "Visa, Mastercard, RuPay" },
  { id: "cod", title: "Cash on delivery", hint: "Pay when it arrives" },
];

function CheckoutForm() {
  const { state, user, neighborhood, listingById, shopById, catalogById, dispatch } = useApp();
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const addresses = user?.addresses ?? [];
  const defaultId = user?.defaultAddressId ?? addresses[0]?.id ?? "new";
  const [addressId, setAddressId] = useState(addresses.length ? defaultId : "new");
  const [draft, setDraft] = useState(() => ({
    ...emptyAddressDraft(),
    pinCode: user?.pinCode ?? "",
    line: addresses.length ? "" : `Near ${neighborhood.name}, ${neighborhood.area}`,
  }));
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>(user?.preferredPayment ?? "upi");
  const [upiId, setUpiId] = useState(user?.savedUpiId ?? "");
  const [saveUpi, setSaveUpi] = useState(Boolean(user?.savedUpiId));
  const [cardName, setCardName] = useState(user?.name ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
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
  const summary = cartSummary(shipments);
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
    if (method === "card") {
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
        },
      });
    }
    if (method === "upi" && saveUpi) {
      dispatch({ type: "setPaymentPrefs", preferredPayment: "upi", savedUpiId: upiId.trim() });
    } else if (method === "card" && cardId === "new" && saveCard) {
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
    for (const shipment of shipments) {
      dispatch({
        type: "placeOrder",
        order: {
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
          })),
          deliveryMode: shipment.deliveryMode,
          status: "placed",
          subtotal: shipment.subtotal,
          deliveryFee: shipment.deliveryFee,
          total: shipment.total,
          createdAt: new Date().toISOString(),
          address,
          timeline: [{ status: "placed", at: new Date().toISOString() }],
          paymentMethod: method,
          paymentStatus: method === "cod" ? "cod" : "paid",
        },
      });
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

        {method === "card" && (
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
              <span className="font-medium">New credit / debit card</span>
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
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="font-semibold">Arriving in {deliveryCountLabel(summary.deliveryCount)}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {shipments.map((shipment, index) => (
            <li key={shipment.shop.id} className="flex justify-between gap-3">
              <span className="text-stone-600">
                Delivery {index + 1} · {shipment.shop.name} · {shipment.itemCount} item
                {shipment.itemCount === 1 ? "" : "s"}
              </span>
              <span className="font-semibold">{formatInr(shipment.total)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-lg font-semibold">Total {formatInr(summary.total)}</p>
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
            ? `Place order · ${formatInr(summary.total)}`
            : `Pay ${formatInr(summary.total)}`}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutForm />
    </RequireAuth>
  );
}
