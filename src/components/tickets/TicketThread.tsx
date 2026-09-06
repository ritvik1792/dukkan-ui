"use client";

import { Field, Select, TextArea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import { shopStaff } from "@/lib/orders";
import type { Ticket } from "@/lib/types";
import { useState } from "react";

export function TicketThread({
  ticket,
  canAssign = false,
  canReply = true,
  variant = "card",
}: {
  ticket: Ticket;
  canAssign?: boolean;
  canReply?: boolean;
  variant?: "card" | "plain";
}) {
  const { user, state, dispatch, shopById } = useApp();
  const [draft, setDraft] = useState("");
  const shop = shopById(ticket.shopId ?? "");
  const assignees = shopStaff(state.users, shop);
  const assigned = state.users.find((u) => u.id === ticket.assignedToUserId);

  function send() {
    const body = draft.trim();
    if (!user || !body) return;
    dispatch({
      type: "addTicketMessage",
      ticketId: ticket.id,
      authorId: user.id,
      body,
    });
    setDraft("");
  }

  const plain = variant === "plain";

  return (
    <div className={plain ? "space-y-3" : "rounded-2xl border border-stone-200 bg-white p-4"}>
      {!plain && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{ticket.subject}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {ticket.id}
                {ticket.orderId ? ` · ${ticket.orderId}` : ""}
              </p>
            </div>
            <StatusPill>
              {ticket.kind} · {titleCase(ticket.status)}
            </StatusPill>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Assigned to {assigned?.name ?? "nobody yet"}
          </p>
        </>
      )}
      {canAssign && (
        <div className="mt-2 max-w-xs">
          <Field label="Assign to">
            <Select
              value={ticket.assignedToUserId ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "assignTicket",
                  ticketId: ticket.id,
                  userId: e.target.value,
                })
              }
            >
              <option value="">Unassigned</option>
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.role}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {ticket.messages.map((message) => {
          const author = state.users.find((u) => u.id === message.authorId);
          const mine = Boolean(user && message.authorId === user.id);
          return (
            <li
              key={message.id}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                mine ? "ml-auto bg-ink text-lime" : "bg-cream text-ink"
              }`}
            >
              <p className={`text-[11px] ${mine ? "text-lime/70" : "text-stone-500"}`}>
                {author?.name ?? "Unknown"} · {formatDate(message.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
            </li>
          );
        })}
      </ul>
      {canReply && user && (
        <div className="mt-3">
          <TextArea
            rows={2}
            placeholder="Write a reply"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-lime"
              onClick={send}
            >
              Send
            </button>
            {canAssign && ticket.status !== "resolved" && ticket.status !== "closed" && (
              <button
                type="button"
                className="rounded-full border border-stone-200 px-3 py-1.5 text-xs"
                onClick={() =>
                  dispatch({
                    type: "setTicketStatus",
                    ticketId: ticket.id,
                    status: "resolved",
                  })
                }
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
