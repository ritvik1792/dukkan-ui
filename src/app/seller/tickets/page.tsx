"use client";

import { TicketDetailSheet } from "@/components/tickets/TicketDetailSheet";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import type { Ticket, TicketKind, TicketStatus } from "@/lib/types";
import { afterPaint } from "@/lib/drawer";
import { useEffect, useMemo, useState } from "react";

export default function SellerTicketsPage() {
  const { user, state, catalogById, listingById } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetShown, setSheetShown] = useState(false);

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((s) => user && (s.ownerUserId === user.id || user.role === "admin"))
          .map((s) => s.id),
      ),
    [state.shops, user],
  );

  const tickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.tickets.filter((ticket) => {
      if (ticket.hidden) return false;
      if (!ticket.shopId || !shopIds.has(ticket.shopId)) return false;
      if (statusFilter && ticket.status !== statusFilter) return false;
      if (kindFilter && ticket.kind !== kindFilter) return false;
      if (!q) return true;
      const assigned = state.users.find((u) => u.id === ticket.assignedToUserId)?.name ?? "";
      const listing = ticket.listingId ? listingById(ticket.listingId) : undefined;
      const product = listing ? catalogById(listing.catalogProductId) : undefined;
      const order = ticket.orderId
        ? state.orders.find((item) => item.id === ticket.orderId)
        : undefined;
      return `${ticket.subject} ${ticket.id} ${ticket.orderId ?? ""} ${order?.paymentRefId ?? ""} ${assigned} ${product?.name ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [state.tickets, state.orders, state.users, shopIds, search, statusFilter, kindFilter, listingById, catalogById]);

  const openTicket = state.tickets.find((t) => t.id === openId);

  useEffect(() => {
    if (!openId) return;
    setSheetShown(false);
    return afterPaint(() => setSheetShown(true));
  }, [openId]);

  function openTicketSheet(ticket: Ticket) {
    setOpenId(ticket.id);
  }

  function closeSheet() {
    setSheetShown(false);
    window.setTimeout(() => setOpenId(null), 320);
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Complaints & tickets</h1>
      <p className="mt-1 text-sm text-stone-500">
        Open a ticket to review the issue, read the chat, and reply.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Subject, order, payment ref, product"
          />
        </Field>
        <Field label="Type">
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="">All types</option>
            {(["complaint", "support"] as TicketKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {titleCase(kind)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {(["open", "in_progress", "resolved", "closed"] as TicketStatus[]).map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="animate-fade-up mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const buyer = state.users.find((u) => u.id === ticket.buyerId);
              const last = ticket.messages[ticket.messages.length - 1];
              const issue = ticket.messages[0]?.body ?? "";
              const order = ticket.orderId
                ? state.orders.find((item) => item.id === ticket.orderId)
                : undefined;
              return (
                <tr
                  key={ticket.id}
                  className="cursor-pointer border-b last:border-0 transition-colors duration-150 hover:bg-stone-50"
                  onClick={() => openTicketSheet(ticket)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-xs text-stone-400">
                      {ticket.id}
                      {ticket.orderId ? ` · ${ticket.orderId}` : ""}
                      {order?.paymentRefId ? ` · ${order.paymentRefId}` : ""}
                    </p>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-stone-600">{issue}</td>
                  <td className="px-4 py-3">{buyer?.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{ticket.kind}</td>
                  <td className="px-4 py-3">
                    <StatusPill>{titleCase(ticket.status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {last ? formatDate(last.createdAt) : formatDate(ticket.createdAt)}
                  </td>
                </tr>
              );
            })}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No tickets match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openTicket && (
        <TicketDetailSheet
          ticket={openTicket}
          shown={sheetShown}
          canAssign
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
