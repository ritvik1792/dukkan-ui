"use client";

import { TicketPhotoPicker, useTicketPhotos } from "@/components/tickets/TicketPhotos";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { paymentMethodLabel } from "@/lib/format";
import { createId } from "@/lib/ids";
import type { TicketKind } from "@/lib/types";
import { FormEvent, useState } from "react";

export default function AccountTicketsPage() {
  const { state, user, dispatch } = useApp();
  const tickets = state.tickets.filter((t) => t.buyerId === user?.id && !t.hidden);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<TicketKind>("support");
  const [shopId, setShopId] = useState(state.shops[0]?.id ?? "");
  const [orderId, setOrderId] = useState("");
  const photos = useTicketPhotos();
  const relatedOrders = state.orders.filter((o) => o.buyerId === user?.id);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !subject.trim() || (!body.trim() && photos.urls.length === 0)) return;
    const related = relatedOrders.find((o) => o.id === orderId);
    dispatch({
      type: "addTicket",
      ticket: {
        id: createId("tk"),
        kind,
        status: "open",
        subject,
        buyerId: user.id,
        shopId: related?.shopId ?? (shopId || undefined),
        orderId: orderId || undefined,
        listingId: related?.items[0]?.listingId,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: createId("m"),
            authorId: user.id,
            body,
            createdAt: new Date().toISOString(),
            imageUrls: photos.urls.length ? photos.urls : undefined,
          },
        ],
      },
    });
    setSubject("");
    setBody("");
    setOrderId("");
    photos.clear();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-4">
        <p className="font-semibold">New ticket</p>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as TicketKind)}>
            <option value="support">Support</option>
            <option value="complaint">Complaint</option>
          </Select>
        </Field>
        <Field label="Related dukkan">
          <Select value={shopId} onChange={(e) => setShopId(e.target.value)}>
            {state.shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Related order">
          <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">None</option>
            {relatedOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.id}
                {order.paymentRefId ? ` · ${order.paymentRefId}` : ""}
                {` · ${paymentMethodLabel(order.paymentMethod)}`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subject">
          <TextInput required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Details">
          <TextArea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Field label="Pictures" hint="optional">
          <TicketPhotoPicker
            urls={photos.urls}
            fileName={photos.fileName}
            onAdd={photos.add}
            onRemove={photos.remove}
          />
        </Field>
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-lime">
          Submit ticket
        </button>
      </form>
      <ul className="space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <TicketThread ticket={ticket} canReply />
          </li>
        ))}
        {tickets.length === 0 && <p className="text-sm text-stone-500">No tickets yet.</p>}
      </ul>
    </div>
  );
}
