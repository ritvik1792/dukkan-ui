"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatInr, formatPhone, titleCase } from "@/lib/format";
import type { Partner, Shop, ShopEmployee, ShopTransport } from "@/lib/types";
import { shopDeliveryModes } from "@/services/pricing";
import { useEffect, useState } from "react";

type DeliveryPane = "settings" | "employees" | "transport";

export function ShopDetailSheet({
  shop,
  shown,
  onClose,
}: {
  shop: Shop;
  shown: boolean;
  onClose: () => void;
}) {
  const { state } = useApp();
  const owner = state.users.find((user) => user.id === shop.ownerUserId);
  const categories = shop.categoryIds
    .map((id) => state.categories.find((category) => category.id === id))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));
  const [pane, setPane] = useState<DeliveryPane>("settings");

  useEffect(() => {
    setPane("settings");
  }, [shop.id]);

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close dukkan"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/40 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-cream shadow-2xl ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-400">Dukkan</p>
            <h2 className="text-lg font-semibold">{shop.name}</h2>
            <p className="mt-1 text-xs text-stone-500">{shop.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill>{titleCase(shop.status)}</StatusPill>
            <button type="button" className="text-sm text-stone-500" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {shop.imageUrl && (
            <div className="overflow-hidden rounded-2xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shop.imageUrl} alt="" className="h-40 w-full object-cover" />
            </div>
          )}

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              About
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-stone-700">
              {shop.description?.trim() || "No description added."}
            </p>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Business
            </p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-stone-400">GST number</dt>
                <dd className="font-mono text-sm">{shop.gstin?.trim() || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Year started</dt>
                <dd>{shop.yearStarted || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Verified</dt>
                <dd>{shop.verified ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Rating</dt>
                <dd>
                  {shop.rating ? `${shop.rating.toFixed(1)} ★` : "—"}
                  <span className="text-stone-400"> · {shop.reviews} reviews</span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Location
            </p>
            <p className="mt-2 text-sm">{shop.address}</p>
            <p className="mt-1 text-xs text-stone-400">
              {shop.coordinates.lat.toFixed(4)}, {shop.coordinates.lng.toFixed(4)}
            </p>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Categories
            </p>
            {categories.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-stone-100 px-3 py-1 text-sm"
                  >
                    {category.emoji} {category.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-500">No categories listed.</p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Owner
            </p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-stone-400">Name</dt>
                <dd>{owner?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Phone</dt>
                <dd>{owner?.phone ? formatPhone(owner.phone) : "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-stone-400">Email</dt>
                <dd>{owner?.email ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Delivery
            </p>
            <div className="mt-3 flex gap-1 rounded-xl bg-stone-100 p-1">
              {(
                [
                  { id: "settings", label: "Settings" },
                  { id: "employees", label: "Employees" },
                  { id: "transport", label: "Transport" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPane(item.id)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                    pane === item.id ? "bg-carrot text-white" : "text-stone-600 hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {pane === "settings" && <DeliverySettings shop={shop} etaMinutes={state.settings.partnerEtaMinutes} />}
              {pane === "employees" && <ShopEmployees shop={shop} />}
              {pane === "transport" && (
                <ShopTransportList shop={shop} partners={state.partners} />
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function DeliverySettings({ shop, etaMinutes }: { shop: Shop; etaMinutes: number }) {
  const modes = shopDeliveryModes(shop);
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-xs text-stone-400">Currently offering</dt>
        <dd>
          {modes.length
            ? modes.map((mode) => (mode === "partner" ? "Dukkan partner" : "Shop riders")).join(" · ")
            : "No delivery mode is on"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400">Dukkan partner</dt>
        <dd>{shop.partnerDeliveryEnabled ? `On · ${formatInr(shop.partnerDeliveryFee)}` : "Off"}</dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400">Shop delivery</dt>
        <dd>{shop.shopDeliveryEnabled ? `On · ${formatInr(shop.shopDeliveryFee)}` : "Off"}</dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400">Minimum order</dt>
        <dd>{shop.minOrderAmount ? formatInr(shop.minOrderAmount) : "None"}</dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400">Partner ETA</dt>
        <dd>{shop.partnerDeliveryEnabled ? `About ${etaMinutes} min` : "—"}</dd>
      </div>
    </dl>
  );
}

function ShopEmployees({ shop }: { shop: Shop }) {
  const employees = shop.employees ?? [];
  if (!shop.shopDeliveryEnabled && employees.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        This dukkan does not run its own delivery. Orders go with Dukkan partners.
      </p>
    );
  }
  if (employees.length === 0) {
    return <p className="text-sm text-stone-500">No shop riders or staff are on file.</p>;
  }
  return (
    <ul className="space-y-2">
      {employees.map((employee) => (
        <EmployeeRow key={employee.id} employee={employee} />
      ))}
    </ul>
  );
}

function EmployeeRow({ employee }: { employee: ShopEmployee }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl bg-cream px-3 py-2.5">
      <div>
        <p className="text-sm font-medium">{employee.name}</p>
        <p className="text-xs text-stone-500">
          {titleCase(employee.role)}
          {employee.phone ? ` · ${formatPhone(employee.phone)}` : ""}
        </p>
      </div>
      <StatusPill>{employee.available ? "available" : "off duty"}</StatusPill>
    </li>
  );
}

function ShopTransportList({ shop, partners }: { shop: Shop; partners: Partner[] }) {
  const vehicles = shop.transport ?? [];
  const partnerFleet = shop.partnerDeliveryEnabled ? partners : [];
  if (vehicles.length === 0 && partnerFleet.length === 0) {
    return <p className="text-sm text-stone-500">No vehicles are listed for this dukkan.</p>;
  }
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-stone-400">Shop vehicles</p>
        {vehicles.length ? (
          <ul className="mt-2 space-y-2">
            {vehicles.map((vehicle) => (
              <TransportRow key={vehicle.id} vehicle={vehicle} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">This dukkan has no own vehicles.</p>
        )}
      </div>
      {shop.partnerDeliveryEnabled && (
        <div>
          <p className="text-xs font-medium text-stone-400">Dukkan partner fleet</p>
          {partnerFleet.length ? (
            <ul className="mt-2 space-y-2">
              {partnerFleet.map((partner) => (
                <li
                  key={partner.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-cream px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{partner.name}</p>
                    <p className="text-xs text-stone-500">
                      {partner.vehicle}
                      {partner.phone ? ` · ${formatPhone(partner.phone)}` : ""}
                    </p>
                  </div>
                  <StatusPill>{partner.available ? "available" : "busy"}</StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">No partner riders are on shift.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TransportRow({ vehicle }: { vehicle: ShopTransport }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl bg-cream px-3 py-2.5">
      <div>
        <p className="text-sm font-medium">{vehicle.label}</p>
        <p className="text-xs text-stone-500">
          {titleCase(vehicle.kind)}
          {vehicle.registration ? ` · ${vehicle.registration}` : ""}
          {vehicle.capacityKg ? ` · ${vehicle.capacityKg} kg` : ""}
        </p>
      </div>
      <StatusPill>{vehicle.available ? "available" : "off road"}</StatusPill>
    </li>
  );
}
