"use client";

import { TicketsTable } from "@/components/tickets/TicketsTable";
import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";

export default function AdminTickets() {
  const { state } = useApp();
  const openCount = state.tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Support tickets</h1>
      <p className="mt-1 text-sm text-stone-500">
        Sort and filter every complaint and support request by dukkan, customer, product, owner, or
        status. Open a row to assign, reply, resolve, or take it down.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Needs attention" value={openCount} hint="Open or in progress" />
        <StatCard
          label="Unassigned"
          value={state.tickets.filter((t) => !t.assignedToUserId && t.status !== "closed").length}
        />
        <StatCard
          label="Complaints"
          value={state.tickets.filter((t) => t.kind === "complaint").length}
        />
        <StatCard label="All tickets" value={state.tickets.length} />
      </div>

      <div className="mt-6">
        <TicketsTable tickets={state.tickets} mode="admin" />
      </div>
    </div>
  );
}
