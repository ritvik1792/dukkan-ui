"use client";

import { Select, TextInput } from "@/components/ui/Field";
import { StatCard, StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import {
  assignSellerPartner,
  createSellerPartner,
  createShopEmployee,
  createShopTransport,
  fetchSellerDelivery,
  mapShop,
  patchSellerPartner,
  patchShopEmployee,
  patchShopTransport,
  unassignSellerPartner,
} from "@/lib/api";
import { formatPhone, titleCase } from "@/lib/format";
import { sellerConsolePath } from "@/lib/routes";
import type { Partner, ShopEmployee, ShopEmployeeRole, ShopTransport, ShopTransportKind } from "@/lib/types";
import { orderStatusLabel } from "@/lib/orders";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const ROLES: ShopEmployeeRole[] = ["rider", "packer", "dispatcher", "manager"];
const KINDS: ShopTransportKind[] = ["bike", "scooter", "cycle", "tempo", "van", "truck"];

export default function SellerDeliveryPage() {
  const { user, state, dispatch } = useApp();
  const { showAlert } = useAlert();
  const [riders, setRiders] = useState<Partner[] | null>(null);
  const [pool, setPool] = useState<Partner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignId, setAssignId] = useState("");
  const [newRider, setNewRider] = useState({ name: "", phone: "", vehicle: "Bike" });
  const [newEmployee, setNewEmployee] = useState({ name: "", phone: "", role: "rider" as ShopEmployeeRole });
  const [newVehicle, setNewVehicle] = useState({
    label: "",
    kind: "bike" as ShopTransportKind,
    registration: "",
    capacityKg: "",
  });

  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const shop = useMemo(() => {
    if (selectedShopId) return state.shops.find((s) => s.id === selectedShopId);
    return (
      state.shops.find((s) => s.id === user?.shopId) ??
      state.shops.find((s) => user && s.ownerUserId === user.id) ??
      state.shops[0]
    );
  }, [selectedShopId, state.shops, user]);
  const shopId = selectedShopId || user?.shopId || shop?.id;

  const reload = useCallback(() => {
    if (!user) return Promise.resolve();
    setError(null);
    return fetchSellerDelivery(shopId)
      .then((snapshot) => {
        setRiders(snapshot.partners);
        setPool(snapshot.pool);
        dispatch({ type: "upsertShop", shop: mapShop(snapshot.shop) });
      })
      .catch((err: unknown) => {
        setRiders([]);
        setError(err instanceof Error ? err.message : "Could not load delivery");
      });
  }, [dispatch, shopId, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!user) return null;

  const list = riders ?? [];
  const availableCount = list.filter((rider) => rider.available).length;
  const employees = shop?.employees ?? [];
  const vehicles = shop?.transport ?? [];
  const shopRiders = employees.filter((employee) => employee.role === "rider");
  const activeOrders = state.orders.filter(
    (order) =>
      order.shopId === shop?.id &&
      ["packing", "ready_for_delivery", "out_for_delivery"].includes(order.status),
  );

  async function run(label: string, work: () => Promise<unknown>) {
    setBusy(true);
    try {
      await work();
      await reload();
      showAlert({ tone: "success", title: label });
    } catch (err: unknown) {
      showAlert({
        tone: "error",
        title: "Could not update delivery",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Delivery</h1>
          <p className="mt-1 text-sm text-stone-500">
            Riders, shop staff, and vehicles for {shop?.name ?? "your dukkan"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user.role === "admin" && state.shops.length > 1 && (
            <Select
              value={shopId ?? ""}
              onChange={(event) => setSelectedShopId(event.target.value)}
              className="w-56"
            >
              {state.shops.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          )}
          <Link
            href={sellerConsolePath("/settings")}
            className="text-sm text-stone-500 underline-offset-2 hover:text-ink hover:underline"
          >
            Fee settings
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available now" value={riders ? availableCount : "—"} hint="Partner riders on shift" />
        <StatCard label="Assigned riders" value={riders ? list.length : "—"} hint="Dukkan partners linked here" />
        <StatCard
          label="Shop riders"
          value={shop ? shopRiders.filter((rider) => rider.available).length : "—"}
          hint={`${shopRiders.length} on this dukkan`}
        />
        <StatCard
          label="Vehicles"
          value={shop ? vehicles.filter((vehicle) => vehicle.available).length : "—"}
          hint={`${vehicles.length} in the shop fleet`}
        />
      </div>

      {shop && (
        <p className="mt-4 text-sm text-stone-500">
          {shop.partnerDeliveryEnabled
            ? `Partner delivery on · ₹${shop.partnerDeliveryFee}`
            : "Partner delivery off"}
          {" · "}
          {shop.shopDeliveryEnabled ? `Shop delivery on · ₹${shop.shopDeliveryFee}` : "Shop delivery off"}
          {shop.minOrderAmount ? ` · min order ₹${shop.minOrderAmount}` : ""}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Dukkan partners</h2>
        <div className="animate-fade-up mt-3 overflow-x-auto rounded-2xl bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-stone-400">
              <tr>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Transport</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders === null && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                    Loading riders…
                  </td>
                </tr>
              )}
              {riders &&
                list.map((rider) => (
                  <tr key={rider.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-xs text-stone-400">{rider.id}</p>
                    </td>
                    <td className="px-4 py-3">{rider.vehicle}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rider.phone ? formatPhone(rider.phone) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill>{rider.available ? "available" : "busy"}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        className="mr-2 text-xs underline"
                        onClick={() =>
                          void run(rider.available ? "Marked busy" : "Marked available", () =>
                            patchSellerPartner(rider.id, { available: !rider.available }, shopId),
                          )
                        }
                      >
                        {rider.available ? "Mark busy" : "Mark available"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="text-xs text-stone-500 underline"
                        onClick={() =>
                          void run("Rider unassigned", () => unassignSellerPartner(rider.id, shopId))
                        }
                      >
                        Unassign
                      </button>
                    </td>
                  </tr>
                ))}
              {riders && list.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                    No riders are assigned to this dukkan yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium">Assign from pool</p>
            <div className="flex flex-wrap items-end gap-2">
              <Select
                value={assignId}
                onChange={(event) => setAssignId(event.target.value)}
                className="min-w-[12rem] flex-1"
              >
                <option value="">Choose rider</option>
                {pool.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name} · {rider.vehicle}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                disabled={busy || !assignId}
                className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-lime disabled:opacity-40"
                onClick={() => {
                  const partnerId = assignId;
                  setAssignId("");
                  void run("Rider assigned", () => assignSellerPartner(partnerId, shopId));
                }}
              >
                Assign
              </button>
            </div>
          </div>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newRider.name.trim() || !newRider.phone.trim()) return;
              const input = { ...newRider };
              setNewRider({ name: "", phone: "", vehicle: "Bike" });
              void run("Rider added", () => createSellerPartner(input, shopId));
            }}
          >
            <p className="text-sm font-medium">Add a partner rider</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <TextInput
                placeholder="Name"
                value={newRider.name}
                onChange={(event) => setNewRider((row) => ({ ...row, name: event.target.value }))}
              />
              <TextInput
                placeholder="Phone"
                value={newRider.phone}
                onChange={(event) => setNewRider((row) => ({ ...row, phone: event.target.value }))}
              />
              <TextInput
                placeholder="Transport"
                value={newRider.vehicle}
                onChange={(event) => setNewRider((row) => ({ ...row, vehicle: event.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full border border-stone-200 px-3 py-1.5 text-xs"
            >
              Add rider
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Shop riders & staff</h2>
        <div className="mt-3 space-y-2">
          {employees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              busy={busy}
              onToggle={() =>
                void run(employee.available ? "Staff off duty" : "Staff available", () =>
                  patchShopEmployee(employee.id, { available: !employee.available }),
                )
              }
            />
          ))}
          {employees.length === 0 && (
            <p className="rounded-2xl bg-white px-4 py-6 text-sm text-stone-500">
              No shop riders or staff are on file.
            </p>
          )}
        </div>
        <form
          className="mt-3 grid gap-2 rounded-2xl bg-white p-4 sm:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!shopId || !newEmployee.name.trim()) return;
            const input = { ...newEmployee };
            setNewEmployee({ name: "", phone: "", role: "rider" });
            void run("Staff added", () => createShopEmployee(shopId, input));
          }}
        >
          <TextInput
            placeholder="Name"
            value={newEmployee.name}
            onChange={(event) => setNewEmployee((row) => ({ ...row, name: event.target.value }))}
          />
          <TextInput
            placeholder="Phone"
            value={newEmployee.phone}
            onChange={(event) => setNewEmployee((row) => ({ ...row, phone: event.target.value }))}
          />
          <Select
            value={newEmployee.role}
            onChange={(event) =>
              setNewEmployee((row) => ({ ...row, role: event.target.value as ShopEmployeeRole }))
            }
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {titleCase(role)}
              </option>
            ))}
          </Select>
          <button type="submit" disabled={busy} className="rounded-full border border-stone-200 px-3 py-2 text-xs">
            Add staff
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Shop vehicles</h2>
        <div className="mt-3 space-y-2">
          {vehicles.map((vehicle) => (
            <TransportRow
              key={vehicle.id}
              vehicle={vehicle}
              busy={busy}
              onToggle={() =>
                void run(vehicle.available ? "Vehicle off road" : "Vehicle available", () =>
                  patchShopTransport(vehicle.id, { available: !vehicle.available }),
                )
              }
            />
          ))}
          {vehicles.length === 0 && (
            <p className="rounded-2xl bg-white px-4 py-6 text-sm text-stone-500">
              This dukkan has no own vehicles.
            </p>
          )}
        </div>
        <form
          className="mt-3 grid gap-2 rounded-2xl bg-white p-4 sm:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!shopId) return;
            const input = {
              label: newVehicle.label,
              kind: newVehicle.kind,
              registration: newVehicle.registration || undefined,
              capacityKg: newVehicle.capacityKg ? Number(newVehicle.capacityKg) : undefined,
            };
            setNewVehicle({ label: "", kind: "bike", registration: "", capacityKg: "" });
            void run("Vehicle added", () => createShopTransport(shopId, input));
          }}
        >
          <TextInput
            placeholder="Label"
            value={newVehicle.label}
            onChange={(event) => setNewVehicle((row) => ({ ...row, label: event.target.value }))}
          />
          <Select
            value={newVehicle.kind}
            onChange={(event) =>
              setNewVehicle((row) => ({ ...row, kind: event.target.value as ShopTransportKind }))
            }
          >
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {titleCase(kind)}
              </option>
            ))}
          </Select>
          <TextInput
            placeholder="Registration"
            value={newVehicle.registration}
            onChange={(event) => setNewVehicle((row) => ({ ...row, registration: event.target.value }))}
          />
          <TextInput
            placeholder="Capacity kg"
            type="number"
            value={newVehicle.capacityKg}
            onChange={(event) => setNewVehicle((row) => ({ ...row, capacityKg: event.target.value }))}
          />
          <button type="submit" disabled={busy} className="rounded-full border border-stone-200 px-3 py-2 text-xs">
            Add vehicle
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Out for delivery</h2>
        <div className="mt-3 space-y-2">
          {activeOrders.map((order) => {
            const partner = list.find((rider) => rider.id === order.partnerId);
            return (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{order.id}</p>
                  <p className="text-xs text-stone-500">
                    {order.deliveryMode === "partner" ? "Partner" : "Shop"}
                    {partner ? ` · ${partner.name}` : order.partnerId ? ` · ${order.partnerId}` : " · no rider yet"}
                    {` · ${order.address}`}
                  </p>
                </div>
                <StatusPill>{orderStatusLabel(order.status)}</StatusPill>
              </div>
            );
          })}
          {activeOrders.length === 0 && (
            <p className="rounded-2xl bg-white px-4 py-6 text-sm text-stone-500">
              No orders are packing or out for delivery.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function EmployeeRow({
  employee,
  busy,
  onToggle,
}: {
  employee: ShopEmployee;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium">{employee.name}</p>
        <p className="text-xs text-stone-500">
          {titleCase(employee.role)}
          {employee.phone ? ` · ${formatPhone(employee.phone)}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill>{employee.available ? "available" : "off duty"}</StatusPill>
        <button type="button" disabled={busy} className="text-xs underline" onClick={onToggle}>
          {employee.available ? "Off duty" : "On duty"}
        </button>
      </div>
    </div>
  );
}

function TransportRow({
  vehicle,
  busy,
  onToggle,
}: {
  vehicle: ShopTransport;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium">{vehicle.label}</p>
        <p className="text-xs text-stone-500">
          {titleCase(vehicle.kind)}
          {vehicle.registration ? ` · ${vehicle.registration}` : ""}
          {vehicle.capacityKg ? ` · ${vehicle.capacityKg} kg` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill>{vehicle.available ? "available" : "off road"}</StatusPill>
        <button type="button" disabled={busy} className="text-xs underline" onClick={onToggle}>
          {vehicle.available ? "Off road" : "On road"}
        </button>
      </div>
    </div>
  );
}
