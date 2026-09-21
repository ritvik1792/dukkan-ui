"use client";

import { StatCard, StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatInr, titleCase } from "@/lib/format";
import { adminAnalytics } from "@/services/analytics";
import Link from "next/link";
import { useMemo } from "react";

export default function AdminHome() {
  const { state } = useApp();
  const stats = useMemo(
    () =>
      adminAnalytics({
        shops: state.shops,
        listings: state.listings,
        orders: state.orders,
        reviews: state.reviews,
        catalog: state.catalog,
        applications: state.applications,
        tickets: state.tickets,
      }),
    [state],
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Platform analytics</h1>
      <p className="mt-1 text-sm text-stone-500">
        Shop uploads go live on their own. Join requests still need your review. Use this
        board to watch every seller, then step into products, tags, tickets, or applications.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="GMV"
          value={formatInr(stats.revenue)}
          hint={`${stats.orderCount} orders`}
        />
        <StatCard
          label="Sellers"
          value={stats.activeShopCount}
          hint={`${stats.pendingShopCount} awaiting review · ${stats.suspendedShopCount} suspended`}
        />
        <StatCard
          label="Live products"
          value={stats.liveListingCount}
          hint={`${stats.hiddenListingCount} hidden by admin`}
        />
        <StatCard
          label="Join requests"
          value={stats.applications.awaiting.length}
          hint={`${stats.applications.approved} approved · ${stats.applications.rejected} rejected`}
        />
        <StatCard
          label="Open tickets"
          value={stats.tickets.open + stats.tickets.inProgress}
          hint={`${stats.tickets.complaints} complaints · ${stats.tickets.support} support`}
        />
        <StatCard
          label="Reviews"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          hint={`${stats.reviewCount} reviews`}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">All sellers</h2>
            <p className="text-sm text-stone-500">Revenue, orders, and catalogue for every dukkan.</p>
          </div>
          <Link href="/admin/sellers" className="text-sm underline">
            Manage dukkans
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-stone-400">
              <tr>
                <th className="px-4 py-3">Dukkan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {stats.shops.map((row) => (
                <tr key={row.shop.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.shop.name}</p>
                    <p className="text-xs text-stone-400">{row.shop.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill>{titleCase(row.shop.status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3">{formatInr(row.revenue)}</td>
                  <td className="px-4 py-3">{row.orders}</td>
                  <td className="px-4 py-3">
                    {row.liveListingCount}
                    <span className="text-stone-400"> / {row.listingCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.rating ? row.rating.toFixed(1) : "—"}
                    <span className="text-stone-400"> · {row.reviewCount}</span>
                  </td>
                </tr>
              ))}
              {stats.shops.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                    No sellers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Join requests to review</h2>
              <p className="text-sm text-stone-500">New shops do not go live until you approve them.</p>
            </div>
            <Link href="/admin/applications" className="text-sm underline">
              Open queue
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {stats.applications.awaiting.map((app) => (
              <li key={app.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{app.businessName}</span>
                <StatusPill>{titleCase(app.status)}</StatusPill>
              </li>
            ))}
            {stats.applications.awaiting.length === 0 && (
              <li className="text-sm text-stone-500">No applications waiting.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Complaints & support</h2>
              <p className="text-sm text-stone-500">Monitor and reply to any ticket on the platform.</p>
            </div>
            <Link href="/admin/tickets" className="text-sm underline">
              Manage tickets
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {stats.tickets.active.slice(0, 5).map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="capitalize text-stone-400">{ticket.kind} · </span>
                  {ticket.subject}
                </span>
                <StatusPill>{titleCase(ticket.status)}</StatusPill>
              </li>
            ))}
            {stats.tickets.active.length === 0 && (
              <li className="text-sm text-stone-500">No open tickets.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="font-semibold">Products bought most</h2>
          <ul className="mt-3 space-y-2">
            {stats.topProducts.slice(0, 8).map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
                <span>{p.name}</span>
                <span>{p.qty}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-semibold">Places buying most</h2>
          <ul className="mt-3 space-y-2">
            {stats.places.slice(0, 8).map((p) => (
              <li key={p.place} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
                <span>{p.place}</span>
                <span>{formatInr(p.spend)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
