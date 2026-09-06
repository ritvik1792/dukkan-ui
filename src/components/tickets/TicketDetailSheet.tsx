"use client";

import { TicketThread } from "@/components/tickets/TicketThread";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import type { Ticket } from "@/lib/types";

export function TicketDetailSheet({
  ticket,
  shown,
  canAssign = false,
  onClose,
}: {
  ticket: Ticket;
  shown: boolean;
  canAssign?: boolean;
  onClose: () => void;
}) {
  const { state, shopById, listingById, catalogById } = useApp();
  const shop = shopById(ticket.shopId ?? "");
  const buyer = state.users.find((u) => u.id === ticket.buyerId);
  const listing = ticket.listingId ? listingById(ticket.listingId) : undefined;
  const product = listing ? catalogById(listing.catalogProductId) : undefined;
  const assigned = state.users.find((u) => u.id === ticket.assignedToUserId);
  const issue = ticket.messages[0];

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close ticket"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/40 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-cream shadow-2xl ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-400">Ticket</p>
            <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-stone-500">
              {ticket.id}
              {ticket.orderId ? ` · ${ticket.orderId}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill>
              {ticket.kind} · {titleCase(ticket.status)}
            </StatusPill>
            <button type="button" className="text-sm text-stone-500" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              What was the issue
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {issue?.body ?? "No details were added."}
            </p>
            {issue && (
              <p className="mt-2 text-xs text-stone-400">
                Opened {formatDate(issue.createdAt)}
                {buyer ? ` by ${buyer.name}` : ""}
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Review</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-stone-400">Customer</dt>
                <dd>{buyer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Dukkan</dt>
                <dd>{shop?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Assigned to</dt>
                <dd>{assigned?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Opened</dt>
                <dd>{formatDate(ticket.createdAt)}</dd>
              </div>
              {ticket.orderId && (
                <div>
                  <dt className="text-xs text-stone-400">Order</dt>
                  <dd>{ticket.orderId}</dd>
                </div>
              )}
              {product && (
                <div>
                  <dt className="text-xs text-stone-400">Product</dt>
                  <dd>{product.name}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Chat
            </p>
            <TicketThread ticket={ticket} canAssign={canAssign} canReply variant="plain" />
          </section>
        </div>
      </aside>
    </div>
  );
}
