"use client";

import { TicketDetailSheet } from "@/components/tickets/TicketDetailSheet";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import { afterPaint } from "@/lib/drawer";
import type { Ticket, TicketKind, TicketStatus } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export default function AdminTickets() {
  const { state, catalogById, listingById, shopById } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetShown, setSheetShown] = useState(false);

  const tickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.tickets.filter((ticket) => {
      if (statusFilter && ticket.status !== statusFilter) return false;
      if (kindFilter && ticket.kind !== kindFilter) return false;
      if (!q) return true;
      const assigned = state.users.find((u) => u.id === ticket.assignedToUserId)?.name ?? "";
      const buyer = state.users.find((u) => u.id === ticket.buyerId)?.name ?? "";
      const shop = ticket.shopId ? shopById(ticket.shopId)?.name ?? "" : "";
      const listing = ticket.listingId ? listingById(ticket.listingId) : undefined;
      const product = listing ? catalogById(listing.catalogProductId) : undefined;
      const order = ticket.orderId
        ? state.orders.find((item) => item.id === ticket.orderId)
        : undefined;
      return `${ticket.subject} ${ticket.id} ${ticket.orderId ?? ""} ${order?.paymentRefId ?? ""} ${assigned} ${buyer} ${shop} ${product?.name ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [state.tickets, state.orders, state.users, search, statusFilter, kindFilter, listingById, catalogById, shopById]);

  const openTicket = state.tickets.find((t) => t.id === openId);
  const openCount = state.tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Support tickets</h1>
      <p className="mt-1 text-sm text-stone-500">
        Monitor every complaint and support request. Open a row to assign, reply, resolve, or take it down.
        {openCount ? ` ${openCount} still need attention.` : " Nothing is waiting."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Subject, shop, customer, order, payment ref"
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

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Dukkan</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const buyer = state.users.find((u) => u.id === ticket.buyerId);
              const shop = ticket.shopId ? shopById(ticket.shopId) : undefined;
              const last = ticket.messages[ticket.messages.length - 1];
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
                  <td className="px-4 py-3">{shop?.name ?? "—"}</td>
                  <td className="px-4 py-3">{buyer?.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{ticket.kind}</td>
                  <td className="px-4 py-3">
                    <StatusPill>{ticket.hidden ? "Taken down" : titleCase(ticket.status)}</StatusPill>
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
