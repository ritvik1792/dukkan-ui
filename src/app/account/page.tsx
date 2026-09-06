"use client";

import { AddressFields, emptyAddressDraft } from "@/components/address/AddressFields";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import { Field, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { MAX_SHOP_RADIUS_KM, MIN_SHOP_RADIUS_KM } from "@/lib/constants";
import { cardBrandLabel, formatDate, formatPhone, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import {
  cardBrandFromNumber,
  clampShopRadiusKm,
  findUserByEmail,
  formatAddressLine,
  maskCardNumber,
  normalizePhone,
  validateBuyerProfile,
  validatePinCode,
} from "@/services/auth";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type ProfileTab = "details" | "addresses" | "payments";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "details", label: "Personal details" },
  { id: "addresses", label: "Saved addresses" },
  { id: "payments", label: "Saved payment methods" },
];

export default function AccountSettingsPage() {
  const { user, isAuthenticated, state, shopById } = useApp();
  const { openAuth } = useAuthDialog();
  const [tab, setTab] = useState<ProfileTab>("details");

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-wider text-stone-400">Profile</p>
        <h1 className="mt-1 text-xl font-semibold">Sign in to manage your profile</h1>
        <p className="mt-2 text-sm text-stone-500">
          Phone OTP login saves your details, addresses, and cards.
        </p>
        <button
          type="button"
          onClick={() => openAuth()}
          className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-lime"
        >
          Sign in with phone
        </button>
      </div>
    );
  }

  const tickets = state.tickets.filter((t) => t.buyerId === user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
      <nav className="rounded-2xl bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Profile</p>
        <ul className="mt-2 space-y-1">
          {TABS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-200 ${
                  tab === item.id ? "bg-ink text-lime" : "hover:bg-stone-100"
                }`}
              >
                <span className="w-4 text-center text-xs opacity-60">
                  {index === TABS.length - 1 ? "└" : "├"}
                </span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-6">
        {tab === "details" && (
          <>
            <RadiusSection />
            <ProfileSection />
            <section className="space-y-3 rounded-2xl bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Support tickets</h2>
                  <p className="text-sm text-stone-500">Complaints and help requests on your account.</p>
                </div>
                <Link href="/account/tickets" className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-lime">
                  Open tickets
                </Link>
              </div>
              <ul className="space-y-2">
                {tickets.slice(0, 3).map((ticket) => (
                  <li key={ticket.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{ticket.subject}</span>
                    <StatusPill>
                      {ticket.kind} · {titleCase(ticket.status)}
                    </StatusPill>
                  </li>
                ))}
                {tickets.length === 0 && <p className="text-sm text-stone-500">No tickets yet.</p>}
              </ul>
              {tickets[0] && (
                <p className="text-xs text-stone-400">
                  Latest: {shopById(tickets[0].shopId ?? "")?.name} · {formatDate(tickets[0].createdAt)}
                </p>
              )}
            </section>
          </>
        )}
        {tab === "addresses" && <AddressBook />}
        {tab === "payments" && <PaymentBook />}
      </div>
    </div>
  );
}

function RadiusSection() {
  const { user, dispatch, shopRadiusKm } = useApp();
  if (!user) return null;
  return (
    <section className="space-y-4 rounded-2xl bg-white p-5">
      <div>
        <h2 className="font-semibold">Preferences</h2>
        <p className="text-sm text-stone-500">How far to look for nearby dukkans.</p>
      </div>
      <Field label="Shops within (km)" hint={`${MIN_SHOP_RADIUS_KM}–${MAX_SHOP_RADIUS_KM}`}>
        <TextInput
          type="number"
          min={MIN_SHOP_RADIUS_KM}
          max={MAX_SHOP_RADIUS_KM}
          value={shopRadiusKm}
          onChange={(e) =>
            dispatch({
              type: "upsertUser",
              user: { ...user, shopRadiusKm: clampShopRadiusKm(Number(e.target.value)) },
            })
          }
        />
      </Field>
    </section>
  );
}

function ProfileSection() {
  const { user, state, dispatch } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [dob, setDob] = useState(user?.dob ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pinCode, setPinCode] = useState(user?.pinCode ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setDob(user.dob ?? "");
    setEmail(user.email.endsWith("@phone.dukkan") ? "" : user.email);
    setPhone(user.phone ?? "");
    setPinCode(user.pinCode ?? "");
  }, [user?.id]);

  if (!user) return null;

  function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaved(false);
    const invalid = validateBuyerProfile({ name, dob, email, phone, pinCode });
    if (invalid) {
      setError(invalid);
      return;
    }
    const taken = email.trim() ? findUserByEmail(state.users, email) : undefined;
    if (taken && taken.id !== user.id) {
      setError("That email already has an account.");
      return;
    }
    dispatch({
      type: "upsertUser",
      user: {
        ...user,
        name: name.trim(),
        dob,
        email: email.trim().toLowerCase() || user.email,
        phone: normalizePhone(phone),
        pinCode: pinCode.trim(),
      },
    });
    setError("");
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl bg-white p-5">
      <div>
        <h2 className="font-semibold">Personal details</h2>
        <p className="text-sm text-stone-500">
          Signed in as {formatPhone(user.phone ?? "")}. Edit anything else here.
        </p>
      </div>
      <Field label="Name">
        <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Date of birth">
        <TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      </Field>
      <Field label="Email">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Phone number">
        <TextInput
          required
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <Field label="PIN code">
        <TextInput
          inputMode="numeric"
          maxLength={6}
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value)}
        />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-700">Profile saved.</p>}
      <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-lime">
        Save profile
      </button>
    </form>
  );
}

function AddressBook() {
  const { user, dispatch } = useApp();
  const [draft, setDraft] = useState(emptyAddressDraft);
  const [error, setError] = useState("");
  const addresses = user?.addresses ?? [];

  if (!user) return null;

  function add(e: FormEvent) {
    e.preventDefault();
    const pinError = validatePinCode(draft.pinCode);
    if (draft.line.trim().length < 8) {
      setError("Enter a full address.");
      return;
    }
    if (pinError) {
      setError(pinError);
      return;
    }
    dispatch({
      type: "saveAddress",
      setDefault: addresses.length === 0,
      address: {
        id: createId("addr"),
        label: draft.label.trim() || "Home",
        line: draft.line.trim(),
        pinCode: draft.pinCode.trim(),
      },
    });
    setDraft(emptyAddressDraft());
    setError("");
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5">
      <div>
        <h2 className="font-semibold">Saved addresses</h2>
        <p className="text-sm text-stone-500">Used at checkout.</p>
      </div>
      <ul className="space-y-2">
        {addresses.map((item) => {
          const isDefault = user.defaultAddressId === item.id;
          return (
            <li key={item.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {item.label}
                    {isDefault ? <span className="ml-2 text-xs text-teal-700">Default</span> : null}
                  </p>
                  <p className="mt-0.5 text-stone-500">{formatAddressLine(item)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!isDefault && (
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => dispatch({ type: "setDefaultAddress", addressId: item.id })}
                    >
                      Default
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-red-700 underline"
                    onClick={() => dispatch({ type: "deleteAddress", addressId: item.id })}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {addresses.length === 0 && <p className="text-sm text-stone-500">No saved addresses yet.</p>}
      </ul>
      <form onSubmit={add} className="border-t border-stone-100 pt-4">
        <p className="mb-3 text-sm font-medium">Add address</p>
        <AddressFields value={draft} onChange={setDraft} />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button type="submit" className="mt-3 rounded-full bg-ink px-4 py-2 text-sm text-lime">
          Save address
        </button>
      </form>
    </section>
  );
}

function PaymentBook() {
  const { user, dispatch } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  const cards = user?.cards ?? [];

  if (!user) return null;

  function add(e: FormEvent) {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (name.trim().length < 2) {
      setError("Enter the name on the card.");
      return;
    }
    if (digits.length < 12) {
      setError("Enter a card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("Enter expiry as MM/YY.");
      return;
    }
    dispatch({
      type: "saveCard",
      setDefault: cards.length === 0,
      card: {
        id: createId("card"),
        brand: cardBrandFromNumber(digits),
        last4: maskCardNumber(digits),
        expiry,
        name: name.trim(),
      },
    });
    setNumber("");
    setExpiry("");
    setError("");
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5">
      <div>
        <h2 className="font-semibold">Saved payment methods</h2>
        <p className="text-sm text-stone-500">Credit and debit cards. We only keep the last 4 digits.</p>
      </div>
      <ul className="space-y-2">
        {cards.map((card) => {
          const isDefault = user.defaultCardId === card.id;
          return (
            <li key={card.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {cardBrandLabel(card.brand)} · •••• {card.last4}
                    {isDefault ? <span className="ml-2 text-xs text-teal-700">Default</span> : null}
                  </p>
                  <p className="mt-0.5 text-stone-500">
                    {card.name} · Expires {card.expiry}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!isDefault && (
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => dispatch({ type: "setDefaultCard", cardId: card.id })}
                    >
                      Default
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-red-700 underline"
                    onClick={() => dispatch({ type: "deleteCard", cardId: card.id })}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {cards.length === 0 && <p className="text-sm text-stone-500">No saved cards yet.</p>}
      </ul>
      <form onSubmit={add} className="space-y-3 border-t border-stone-100 pt-4">
        <p className="text-sm font-medium">Add credit / debit card</p>
        <Field label="Name on card">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Card number">
          <TextInput
            inputMode="numeric"
            autoComplete="cc-number"
            value={number}
            onChange={(e) =>
              setNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))
            }
            placeholder="XXXX XXXX XXXX XXXX"
          />
        </Field>
        <Field label="Expiry">
          <TextInput
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
              setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
            }}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-lime">
          Save card
        </button>
      </form>
    </section>
  );
}
