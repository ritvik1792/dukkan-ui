"use client";

import { ShopNameButton } from "@/components/shops/ShopPeek";
import { TicketDetailSheet } from "@/components/tickets/TicketDetailSheet";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { formatDate, titleCase } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type TicketRow = {
  ticket: Ticket;
  issue: string;
  shopName: string;
  buyerName: string;
  productName: string;
  assignedName: string;
  paymentRefId: string;
  kind: string;
  status: string;
  updatedAt: string;
};

export function TicketsTable({
  tickets,
  mode,
  hiddenColumns = [],
  emptyMessage = "No tickets match these filters.",
}: {
  tickets: Ticket[];
  mode: "seller" | "admin";
  hiddenColumns?: string[];
  emptyMessage?: string;
}) {
  const { state, catalogById, listingById, shopById } = useApp();
  const searchParams = useSearchParams();
  const ticketFromUrl = searchParams.get("ticket");
  const [openId, setOpenId] = useState<string | null>(ticketFromUrl);
  const [sheetShown, setSheetShown] = useState(false);

  const rows = useMemo<TicketRow[]>(
    () =>
      tickets.map((ticket) => {
        const listing = ticket.listingId ? listingById(ticket.listingId) : undefined;
        const product = listing ? catalogById(listing.catalogProductId) : undefined;
        const order = ticket.orderId
          ? state.orders.find((item) => item.id === ticket.orderId)
          : undefined;
        const last = ticket.messages[ticket.messages.length - 1];
        return {
          ticket,
          issue: ticket.messages[0]?.body ?? "",
          shopName: ticket.shopId ? (shopById(ticket.shopId)?.name ?? "—") : "—",
          buyerName: state.users.find((u) => u.id === ticket.buyerId)?.name ?? "—",
          productName: product?.name ?? "—",
          assignedName:
            state.users.find((u) => u.id === ticket.assignedToUserId)?.name ?? "Unassigned",
          paymentRefId: order?.paymentRefId ?? "",
          kind: titleCase(ticket.kind),
          status: ticket.hidden ? "Taken down" : titleCase(ticket.status),
          updatedAt: last?.createdAt ?? ticket.createdAt,
        };
      }),
    [tickets, state.orders, state.users, listingById, catalogById, shopById],
  );

  const openTicket = state.tickets.find((t) => t.id === openId);

  useEffect(() => {
    if (ticketFromUrl) setOpenId(ticketFromUrl);
  }, [ticketFromUrl]);

  useEffect(() => {
    if (!openId) return;
    setSheetShown(false);
    return afterPaint(() => setSheetShown(true));
  }, [openId]);

  function closeSheet() {
    setSheetShown(false);
    window.setTimeout(() => setOpenId(null), 320);
  }

  const allColumns: Column<TicketRow>[] = [
    {
      id: "ticket",
      header: "Ticket",
      value: (row) => row.ticket.subject,
      filter: { kind: "text", placeholder: "Subject contains…" },
      render: (row) => (
        <div>
          <p className="font-medium">{row.ticket.subject}</p>
          <p className="text-xs text-stone-400">
            {row.ticket.id}
            {row.ticket.orderId ? ` · ${row.ticket.orderId}` : ""}
            {row.paymentRefId ? ` · ${row.paymentRefId}` : ""}
          </p>
        </div>
      ),
    },
    {
      id: "issue",
      header: "Issue",
      value: (row) => row.issue,
      filter: { kind: "text", placeholder: "Message contains…" },
      sortable: false,
      render: (row) => (
        <span className="block max-w-xs truncate text-stone-600">{row.issue || "—"}</span>
      ),
    },
    {
      id: "shop",
      header: "Dukkan",
      value: (row) => row.shopName,
      filter: { kind: "select" },
      render: (row) => (
        <ShopNameButton shopId={row.ticket.shopId}>{row.shopName}</ShopNameButton>
      ),
    },
    { id: "buyer", header: "Customer", value: (row) => row.buyerName, filter: { kind: "select" } },
    {
      id: "product",
      header: "Product",
      value: (row) => row.productName,
      filter: { kind: "select" },
      defaultHidden: true,
    },
    {
      id: "assigned",
      header: "Assigned to",
      value: (row) => row.assignedName,
      filter: { kind: "select" },
      defaultHidden: mode === "seller",
    },
    { id: "kind", header: "Type", value: (row) => row.kind, filter: { kind: "select" } },
    {
      id: "messages",
      header: "Messages",
      value: (row) => row.ticket.messages.length,
      filter: { kind: "range" },
      align: "right",
      defaultHidden: true,
    },
    {
      id: "status",
      header: "Status",
      value: (row) => row.status,
      filter: { kind: "select" },
      render: (row) => <StatusPill>{row.status}</StatusPill>,
    },
    {
      id: "created",
      header: "Opened",
      value: (row) => row.ticket.createdAt,
      defaultHidden: true,
      render: (row) => (
        <span className="text-xs text-stone-500">{formatDate(row.ticket.createdAt)}</span>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      value: (row) => row.updatedAt,
      render: (row) => <span className="text-xs text-stone-500">{formatDate(row.updatedAt)}</span>,
    },
  ];
  const columns = allColumns.filter((column) => !hiddenColumns.includes(column.id));

  return (
    <div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.ticket.id}
        onRowClick={(row) => setOpenId(row.ticket.id)}
        searchPlaceholder="Search subject, message, dukkan, customer, order, payment ref"
        searchText={(row) => `${row.ticket.id} ${row.paymentRefId}`}
        initialSort={{ columnId: "updated", dir: "desc" }}
        emptyMessage={emptyMessage}
      />

      {openTicket && (
        <TicketDetailSheet ticket={openTicket} shown={sheetShown} canAssign onClose={closeSheet} />
      )}
    </div>
  );
}
