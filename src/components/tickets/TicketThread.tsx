"use client";

import { TicketPhotoGrid, TicketPhotoPicker, useTicketPhotos } from "@/components/tickets/TicketPhotos";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { addTicketMessageRequest, mapTicket, patchTicketRequest } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { shopStaff } from "@/lib/orders";
import type { Ticket } from "@/lib/types";
import { useState } from "react";

export function TicketThread({
  ticket,
  canAssign = false,
  canReply = true,
  variant = "card",
  onOpenOrder,
}: {
  ticket: Ticket;
  canAssign?: boolean;
  canReply?: boolean;
  variant?: "card" | "plain";
  onOpenOrder?: (orderId: string) => void;
}) {
  const { user, state, dispatch, shopById } = useApp();
  const [draft, setDraft] = useState("");
  const photos = useTicketPhotos();
  const shop = shopById(ticket.shopId ?? "");
  const assignees = shopStaff(state.users, shop);
  const assigned = state.users.find((u) => u.id === ticket.assignedToUserId);

  async function send() {
    const body = draft.trim();
    if (!user || (!body && photos.urls.length === 0)) return;
    try {
      const updated = await addTicketMessageRequest(ticket.id, {
        body,
        imageUrls: photos.urls,
      });
      dispatch({ type: "upsertTicket", ticket: mapTicket(updated) });
    } catch {
      dispatch({
        type: "addTicketMessage",
        ticketId: ticket.id,
        authorId: user.id,
        body,
        imageUrls: photos.urls.length ? photos.urls : undefined,
      });
    }
    setDraft("");
    photos.clear();
  }

  const plain = variant === "plain";

  return (
    <div className={plain ? "space-y-3" : "rounded-2xl border border-border bg-white p-4"}>
      {!plain && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{ticket.subject}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                {ticket.id}
                {ticket.orderId ? " · " : ""}
                {ticket.orderId &&
                  (onOpenOrder ? (
                    <button
                      type="button"
                      className="underline decoration-stone-300 hover:decoration-ink"
                      onClick={() => onOpenOrder(ticket.orderId!)}
                    >
                      {ticket.orderId}
                    </button>
                  ) : (
                    ticket.orderId
                  ))}
              </p>
            </div>
            <StatusPill>
              {ticket.hidden ? "taken down" : `${ticket.kind} · ${titleCase(ticket.status)}`}
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
              onChange={(e) => {
                const userId = e.target.value;
                dispatch({ type: "assignTicket", ticketId: ticket.id, userId });
                void patchTicketRequest(ticket.id, { assignedToUserId: userId }).then((updated) =>
                  dispatch({ type: "upsertTicket", ticket: mapTicket(updated) }),
                ).catch(() => undefined);
              }}
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
                mine ? "ml-auto bg-carrot text-white" : "bg-cream text-ink"
              }`}
            >
              <p className={`text-[11px] ${mine ? "text-white/75" : "text-muted"}`}>
                {author?.name ?? "Unknown"} · {formatDate(message.createdAt)}
              </p>
              {message.body && <p className="mt-1 whitespace-pre-wrap">{message.body}</p>}
              {message.imageUrls?.length ? <TicketPhotoGrid urls={message.imageUrls} compact /> : null}
            </li>
          );
        })}
      </ul>
      {canReply && user && (
        <div className="mt-3 space-y-2">
          <TextArea
            rows={2}
            placeholder="Write a reply"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <TicketPhotoPicker
            urls={photos.urls}
            fileName={photos.fileName}
            onAdd={photos.add}
            onRemove={photos.remove}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-carrot px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => void send()}
            >
              Send
            </button>
            {canAssign && ticket.status !== "resolved" && ticket.status !== "closed" && !ticket.hidden && (
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-xs"
                onClick={() => {
                  dispatch({
                    type: "setTicketStatus",
                    ticketId: ticket.id,
                    status: "resolved",
                  });
                  void patchTicketRequest(ticket.id, { status: "resolved" }).then((updated) =>
                    dispatch({ type: "upsertTicket", ticket: mapTicket(updated) }),
                  ).catch(() => undefined);
                }}
              >
                Resolve
              </button>
            )}
            {canAssign && (
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-xs"
                onClick={() => {
                  dispatch({
                    type: "setTicketHidden",
                    ticketId: ticket.id,
                    hidden: !ticket.hidden,
                  });
                  void patchTicketRequest(ticket.id, { hidden: !ticket.hidden }).then((updated) =>
                    dispatch({ type: "upsertTicket", ticket: mapTicket(updated) }),
                  ).catch(() => undefined);
                }}
              >
                {ticket.hidden ? "Restore" : "Take down"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
