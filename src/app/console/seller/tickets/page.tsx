"use client";

import { TicketsTable } from "@/components/tickets/TicketsTable";
import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function SellerTicketsPage() {
  const { user, state } = useApp();

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((s) => user && (s.ownerUserId === user.id || user.role === "admin"))
          .map((s) => s.id),
      ),
    [state.shops, user],
  );

  const tickets = useMemo(
    () =>
      state.tickets.filter(
        (ticket) => !ticket.hidden && ticket.shopId && shopIds.has(ticket.shopId),
      ),
    [state.tickets, shopIds],
  );

  if (!user) return null;

  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Complaints & tickets</h1>
      <p className="mt-1 text-sm text-stone-500">
        Sort and filter by customer, product, type, or status. Open a ticket to review the issue,
        read the chat, and reply.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Needs attention" value={openCount} hint="Open or in progress" />
        <StatCard
          label="Complaints"
          value={tickets.filter((t) => t.kind === "complaint").length}
        />
        <StatCard
          label="Resolved"
          value={tickets.filter((t) => t.status === "resolved").length}
        />
        <StatCard label="All tickets" value={tickets.length} />
      </div>

      <div className="mt-6">
        <TicketsTable tickets={tickets} mode="seller" hiddenColumns={["shop"]} />
      </div>
    </div>
  );
}
