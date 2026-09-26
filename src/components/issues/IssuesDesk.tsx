"use client";

import { ModerationBoard } from "@/components/moderation/ModerationBoard";
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import type { Ticket } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type IssueTab = "buyers" | "requests" | "blocked";

const TABS: { id: IssueTab; label: string }[] = [
  { id: "buyers", label: "From buyers" },
  { id: "requests", label: "With the platform" },
  { id: "blocked", label: "Blocked products" },
];

function isIssueTab(value: string | null): value is IssueTab {
  return value === "buyers" || value === "requests" || value === "blocked";
}

export function IssuesDesk({ mode }: { mode: "seller" | "admin" }) {
  const { user, state } = useApp();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((shop) => user && (shop.ownerUserId === user.id || shop.id === user.shopId))
          .map((shop) => shop.id),
      ),
    [state.shops, user],
  );

  const tickets = useMemo(
    () =>
      mode === "admin"
        ? state.tickets.filter((ticket) => !ticket.hidden)
        : state.tickets.filter(
            (ticket) => !ticket.hidden && ticket.shopId && shopIds.has(ticket.shopId),
          ),
    [mode, state.tickets, shopIds],
  );

  const complaints = tickets.filter((ticket) => ticket.kind === "complaint");
  const requests = tickets.filter((ticket) => ticket.kind === "support");
  const ticketId = params.get("ticket");
  const opened = tickets.find((ticket) => ticket.id === ticketId);
  const requested = params.get("tab");
  const tab: IssueTab = opened
    ? opened.kind === "complaint"
      ? "buyers"
      : "requests"
    : isIssueTab(requested)
      ? requested
      : "buyers";

  function select(next: IssueTab) {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("tab", next);
    const current = tickets.find((ticket) => ticket.id === nextParams.get("ticket"));
    const stays =
      (next === "buyers" && current?.kind === "complaint") ||
      (next === "requests" && current?.kind === "support");
    if (!stays) nextParams.delete("ticket");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  if (!user) return null;

  const visible = tab === "buyers" ? complaints : requests;
  const copy = sectionCopy(mode, tab);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Issues</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500">
        {mode === "admin"
          ? "Buyer complaints, other requests, and products you blocked or corrected."
          : "Buyer complaints, messages with Pink Carrot, and products the platform blocked or changed."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Issue types">
        {TABS.map((item) => {
          const active = tab === item.id;
          const count =
            item.id === "buyers"
              ? complaints.length
              : item.id === "requests"
                ? requests.length
                : state.moderationCases.filter((itemCase) =>
                    mode === "admin" ? true : shopIds.has(itemCase.shopId),
                  ).length;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => select(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                active ? "chip-active" : "chip-idle"
              }`}
            >
              {item.label}
              <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-stone-500">{copy}</p>

      {tab === "blocked" ? (
        <div className="mt-4">
          <ModerationBoard mode={mode} hideHeading />
        </div>
      ) : (
        <TicketSection tickets={visible} mode={mode} empty={emptyCopy(tab)} />
      )}
    </div>
  );
}

function TicketSection({
  tickets,
  mode,
  empty,
}: {
  tickets: Ticket[];
  mode: "seller" | "admin";
  empty: string;
}) {
  const openCount = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress",
  ).length;

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Needs attention" value={openCount} hint="Open or in progress" />
        <StatCard
          label="Resolved"
          value={tickets.filter((ticket) => ticket.status === "resolved").length}
        />
        <StatCard label="In this list" value={tickets.length} />
      </div>
      <div className="mt-6">
        <TicketsTable
          tickets={tickets}
          mode={mode}
          hiddenColumns={mode === "seller" ? ["shop"] : []}
          emptyMessage={empty}
        />
      </div>
    </>
  );
}

function sectionCopy(mode: "seller" | "admin", tab: IssueTab) {
  if (tab === "buyers") {
    return mode === "admin"
      ? "A buyer reported a problem with an order or a product."
      : "A buyer wrote in about an order or a product from your shop.";
  }
  if (tab === "requests") {
    return mode === "admin"
      ? "Other requests, such as invoices or questions, between a buyer, a shop, and Pink Carrot."
      : "Questions and requests that are not complaints, including ones opened with Pink Carrot.";
  }
  return mode === "admin"
    ? "Listings you hid or corrected. Answer a shop that disagrees, or put a listing back."
    : "Products Pink Carrot hid or changed. Read why, reply, or ask to put the listing back.";
}

function emptyCopy(tab: IssueTab) {
  if (tab === "buyers") return "No customer complaints yet.";
  return "No other requests yet.";
}
