"use client";

import { TicketThread } from "@/components/tickets/TicketThread";
import { useApp } from "@/context/AppContext";

export default function AdminTickets() {
  const { state } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Support tickets</h1>
      <p className="mt-1 text-sm text-stone-500">Assign, chat, and update status from each thread.</p>
      <ul className="mt-6 space-y-3">
        {state.tickets.map((ticket) => (
          <li key={ticket.id}>
            <TicketThread ticket={ticket} canAssign canReply />
          </li>
        ))}
      </ul>
    </div>
  );
}
