"use client";

import { TextArea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import { useState } from "react";

export default function SellerTicketsPage() {
  const { user, state, dispatch } = useApp();
  const [reply, setReply] = useState<Record<string, string>>({});
  if (!user) return null;
  const shopIds = new Set(
    state.shops.filter((s) => s.ownerUserId === user.id).map((s) => s.id),
  );
  const tickets = state.tickets.filter((t) => t.shopId && shopIds.has(t.shopId));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Complaints & tickets</h1>
      <ul className="mt-6 space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-2xl bg-white p-4">
            <div className="flex justify-between gap-2">
              <p className="font-semibold">
                {ticket.subject}
                {ticket.orderId ? ` · ${ticket.orderId}` : ""}
              </p>
              <StatusPill>
                {ticket.kind} · {titleCase(ticket.status)}
              </StatusPill>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {ticket.messages.map((m) => (
                <li key={m.id} className="rounded-xl bg-cream px-3 py-2">
                  {m.body}
                  <span className="ml-2 text-xs text-stone-400">{formatDate(m.createdAt)}</span>
                </li>
              ))}
            </ul>
            <TextArea
              className="mt-3"
              rows={2}
              value={reply[ticket.id] ?? ""}
              onChange={(e) => setReply((r) => ({ ...r, [ticket.id]: e.target.value }))}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                onClick={() => {
                  const body = reply[ticket.id]?.trim();
                  if (!body) return;
                  dispatch({
                    type: "addTicketMessage",
                    ticketId: ticket.id,
                    authorId: user.id,
                    body,
                  });
                  setReply((r) => ({ ...r, [ticket.id]: "" }));
                }}
              >
                Reply
              </button>
              <button
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() =>
                  dispatch({ type: "setTicketStatus", ticketId: ticket.id, status: "resolved" })
                }
              >
                Resolve
              </button>
            </div>
          </li>
        ))}
        {tickets.length === 0 && <p className="text-sm text-stone-500">No tickets.</p>}
      </ul>
    </div>
  );
}
