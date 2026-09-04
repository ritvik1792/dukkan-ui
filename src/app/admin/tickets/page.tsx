"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import type { TicketStatus } from "@/lib/types";

export default function AdminTickets() {
  const { state, dispatch, shopById } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Support tickets</h1>
      <ul className="mt-6 space-y-3">
        {state.tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-2xl bg-white p-4">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold">{ticket.subject}</p>
                <p className="text-xs text-stone-500">
                  {shopById(ticket.shopId ?? "")?.name} · {ticket.orderId ?? "no order"}
                </p>
              </div>
              <StatusPill>
                {ticket.kind} · {titleCase(ticket.status)}
              </StatusPill>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {ticket.messages.map((m) => (
                <li key={m.id}>
                  {m.body}{" "}
                  <span className="text-xs text-stone-400">{formatDate(m.createdAt)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              {(["open", "in_progress", "resolved", "closed"] as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs capitalize"
                  onClick={() =>
                    dispatch({ type: "setTicketStatus", ticketId: ticket.id, status })
                  }
                >
                  {titleCase(status)}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
