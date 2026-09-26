"use client";

import { IssuesDesk } from "@/components/issues/IssuesDesk";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Field, TextArea } from "@/components/ui/Field";
import { sellerAwaitingApproval } from "@/console/nav";
import { useApp } from "@/context/AppContext";
import { createTicketRequest, mapTicket } from "@/lib/api";
import { FormEvent, Suspense, useState } from "react";

export default function SellerTicketsPage() {
  const { user, state } = useApp();
  const awaiting =
    user != null && sellerAwaitingApproval(user, state.shops, state.applications);

  if (awaiting) return <PendingSellerSupport />;

  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading issues…</p>}>
      <IssuesDesk mode="seller" />
    </Suspense>
  );
}

function PendingSellerSupport() {
  const { user, state, dispatch } = useApp();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const application = state.applications.find((item) => item.userId === user?.id);
  const shop =
    state.shops.find((item) => item.id === user?.shopId) ??
    state.shops.find((item) => item.ownerUserId === user?.id);
  const mine = state.tickets.filter(
    (ticket) => ticket.buyerId === user?.id && ticket.kind === "support" && !ticket.hidden,
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await createTicketRequest({
        kind: "support",
        subject: `Application: ${application?.businessName ?? shop?.name ?? "Seller account"}`,
        shopId: shop?.id,
        body: body.trim(),
      });
      dispatch({ type: "addTicket", ticket: mapTicket(created) });
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Support</h1>
      <p className="mt-1 text-sm text-stone-500">
        Your ticket with Dukkan admin while the seller account is waiting for approval.
      </p>
      <div className="mt-6 space-y-4">
        {mine.map((ticket) => (
          <TicketThread key={ticket.id} ticket={ticket} canReply />
        ))}
        {mine.length === 0 && (
          <form onSubmit={submit} className="rounded-2xl bg-white p-5">
            <Field label="Message to admin">
              <TextArea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ask about your application"
              />
            </Field>
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white"
            >
              {busy ? "Sending…" : "Send to admin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
