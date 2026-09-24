"use client";

import { TextArea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/format";
import { createId } from "@/lib/ids";
import { caseStatusLabel, eventLabel, reasonLabel } from "@/services/moderation";
import type {
  ModerationCase,
  ModerationCaseStatus,
  ModerationEventKind,
} from "@/lib/types";
import { useState } from "react";

type Reply = {
  kind: ModerationEventKind;
  status: ModerationCaseStatus;
  label: string;
  prompt: string;
  placeholder: string;
  primary?: boolean;
  /** Republish the listing when admin accepts the seller's fix. */
  republish?: boolean;
};

const SELLER_REPLIES: Reply[] = [
  {
    kind: "dispute",
    status: "disputed",
    label: "Dispute this",
    prompt: "Why is this decision wrong?",
    placeholder: "Explain why the listing follows the rules, and link any proof.",
  },
  {
    kind: "republish_request",
    status: "republish_requested",
    label: "Apply to republish",
    prompt: "What did you change?",
    placeholder: "List the edits you made so admin can check them quickly.",
    primary: true,
  },
];

const ADMIN_REPLIES: Reply[] = [
  {
    kind: "approved",
    status: "approved",
    label: "Approve & republish",
    prompt: "Note for the seller",
    placeholder: "Confirm what was fixed. The listing goes live again.",
    primary: true,
    republish: true,
  },
  {
    kind: "declined",
    status: "declined",
    label: "Decline",
    prompt: "Why is it still not publishable?",
    placeholder: "Say what is still missing so the seller can apply again.",
  },
];

export function ModerationThread({
  moderationCase,
  mode,
}: {
  moderationCase: ModerationCase;
  mode: "admin" | "seller";
}) {
  const { user, state, dispatch } = useApp();
  const { showAlert } = useAlert();
  const [reply, setReply] = useState<Reply | null>(null);
  const [body, setBody] = useState("");

  const replies = mode === "admin" ? ADMIN_REPLIES : SELLER_REPLIES;
  const settled = moderationCase.status === "approved";

  function submit() {
    if (!user || !reply) return;
    const text = body.trim();
    if (!text) return;
    dispatch({
      type: "addModerationEvent",
      caseId: moderationCase.id,
      status: reply.status,
      event: {
        id: createId("mev"),
        kind: reply.kind,
        authorId: user.id,
        authorRole: user.role,
        body: text,
        createdAt: new Date().toISOString(),
      },
    });
    if (reply.republish) {
      dispatch({
        type: "setListingStatus",
        listingId: moderationCase.listingId,
        status: "approved",
      });
    }
    showAlert({
      tone: "success",
      title: reply.label,
      message:
        reply.kind === "approved"
          ? "The listing is live again and the seller has been told."
          : "Sent. The other side sees this on their dashboard.",
    });
    setReply(null);
    setBody("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill>{caseStatusLabel(moderationCase.status)}</StatusPill>
        <span className="text-xs text-stone-500">
          {moderationCase.action === "hide" ? "Hidden" : "Overridden"} ·{" "}
          {reasonLabel(moderationCase.reason)} · opened {formatDate(moderationCase.createdAt)}
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {moderationCase.events.map((event) => {
          const author = state.users.find((item) => item.id === event.authorId);
          return (
            <li
              key={event.id}
              className={`rounded-2xl px-4 py-3 text-sm ${
                event.authorRole === "admin" ? "bg-cream" : "bg-cream"
              }`}
            >
              <p className="text-xs font-medium text-stone-500">
                {eventLabel(event.kind)} · {author?.name ?? event.authorRole} ·{" "}
                {formatDate(event.createdAt)}
              </p>
              <p className="mt-1 text-stone-700">{event.body}</p>
            </li>
          );
        })}
      </ol>

      {settled ? (
        <p className="mt-4 text-xs text-stone-500">
          This case is closed. The listing is live again.
        </p>
      ) : (
        <div className="mt-4">
          {reply ? (
            <div>
              <p className="text-sm font-medium">{reply.prompt}</p>
              <TextArea
                rows={3}
                className="mt-1"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={reply.placeholder}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={!body.trim()}
                  onClick={submit}
                  className="rounded-full bg-carrot px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReply(null);
                    setBody("");
                  }}
                  className="rounded-full border border-border px-4 py-1.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {replies.map((item) => (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => setReply(item)}
                  className={`rounded-full px-4 py-1.5 text-xs ${
                    item.primary
                      ? "bg-carrot font-semibold text-white"
                      : "border border-border bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
