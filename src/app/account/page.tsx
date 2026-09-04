"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { MAX_SHOP_RADIUS_KM, MIN_SHOP_RADIUS_KM } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/format";
import {
  clampShopRadiusKm,
  findUserByEmail,
  normalizePhone,
  validateBuyerProfile,
} from "@/services/auth";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function AccountSettingsPage() {
  const { user, isAuthenticated, state, dispatch, shopRadiusKm, shopById } = useApp();

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-wider text-stone-400">Settings</p>
        <h1 className="mt-1 text-xl font-semibold">Log in to manage settings</h1>
        <p className="mt-2 text-sm text-stone-500">
          Profile, shop radius, and support tickets are saved on your account.
        </p>
        <Link
          href="/login?next=/account"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-lime"
        >
          Log in
        </Link>
      </div>
    );
  }

  const tickets = state.tickets.filter((t) => t.buyerId === user.id);

  return (
    <div className="space-y-6">
      <section className="max-w-lg space-y-4 rounded-2xl bg-white p-5">
        <div>
          <h2 className="font-semibold">Preferences</h2>
          <p className="text-sm text-stone-500">
            How far to look for nearby dukkans from your delivery location.
          </p>
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
                user: {
                  ...user,
                  shopRadiusKm: clampShopRadiusKm(Number(e.target.value)),
                },
              })
            }
          />
        </Field>
      </section>

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
          {tickets.length === 0 && (
            <p className="text-sm text-stone-500">No tickets yet.</p>
          )}
        </ul>
        {tickets[0] && (
          <p className="text-xs text-stone-400">
            Latest: {shopById(tickets[0].shopId ?? "")?.name} · {formatDate(tickets[0].createdAt)}
          </p>
        )}
      </section>
    </div>
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
    setEmail(user.email);
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
    const taken = findUserByEmail(state.users, email);
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
        email: email.trim().toLowerCase(),
        phone: normalizePhone(phone),
        pinCode: pinCode.trim(),
      },
    });
    setError("");
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="max-w-lg space-y-4 rounded-2xl bg-white p-5">
      <div>
        <h2 className="font-semibold">Profile</h2>
        <p className="text-sm text-stone-500">
          Signed in as <span className="capitalize">{user.role}</span>. Dukkan uses this for
          orders and support.
        </p>
      </div>
      <Field label="Name">
        <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Date of birth">
        <TextInput required type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      </Field>
      <Field label="Email">
        <TextInput required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
          required
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
