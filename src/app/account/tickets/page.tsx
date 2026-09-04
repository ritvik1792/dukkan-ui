"use client";

import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import type { TicketKind } from "@/lib/types";
import { FormEvent, useState } from "react";

export default function AccountTicketsPage() {
  const { state, user, dispatch, shopById } = useApp();
  const tickets = state.tickets.filter((t) => t.buyerId === user?.id);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<TicketKind>("support");
  const [shopId, setShopId] = useState(state.shops[0]?.id ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !subject.trim() || !body.trim()) return;
    dispatch({
      type: "addTicket",
      ticket: {
        id: createId("tk"),
        kind,
        status: "open",
        subject,
        buyerId: user.id,
        shopId: shopId || undefined,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: createId("m"),
            authorId: user.id,
            body,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    setSubject("");
    setBody("");
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
        <Field label="Subject">
          <TextInput required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Details">
          <TextArea required rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-lime">
          Submit ticket
        </button>
      </form>
      <ul className="space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="rounded-2xl bg-white p-4">
            <div className="flex justify-between gap-2">
              <p className="font-semibold">{ticket.subject}</p>
              <StatusPill>
                {ticket.kind} · {titleCase(ticket.status)}
              </StatusPill>
            </div>
            <p className="text-xs text-stone-500">{shopById(ticket.shopId ?? "")?.name}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {ticket.messages.map((m) => (
                <li key={m.id}>
                  {m.body}{" "}
                  <span className="text-xs text-stone-400">{formatDate(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {tickets.length === 0 && <p className="text-sm text-stone-500">No tickets yet.</p>}
      </ul>
    </div>
  );
}
