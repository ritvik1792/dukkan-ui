"use client";

import { ModerationThread } from "@/components/moderation/ModerationThread";
import { ShopNameButton } from "@/components/shops/ShopPeek";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatCard, StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { formatDate } from "@/lib/format";
import { adminConsolePath, sellerConsolePath } from "@/lib/routes";
import {
  caseStatusLabel,
  isCaseOpen,
  needsAdminReply,
  needsSellerReply,
  reasonLabel,
} from "@/services/moderation";
import type { ModerationCase } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  item: ModerationCase;
  productName: string;
  shopName: string;
  action: string;
  reason: string;
  status: string;
  waitingOn: string;
};

export function ModerationBoard({ mode }: { mode: "admin" | "seller" }) {
  const { user, state, shopById, catalogById } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((shop) => shop.ownerUserId === user?.id || shop.id === user?.shopId)
          .map((shop) => shop.id),
      ),
    [state.shops, user],
  );

  const cases = useMemo(
    () =>
      mode === "admin"
        ? state.moderationCases
        : state.moderationCases.filter((item) => shopIds.has(item.shopId)),
    [state.moderationCases, mode, shopIds],
  );

  const rows = useMemo<Row[]>(
    () =>
      cases.map((item) => ({
        item,
        productName: catalogById(item.catalogProductId)?.name ?? "Unknown product",
        shopName: shopById(item.shopId)?.name ?? "—",
        action: item.action === "hide" ? "Hidden" : "Overridden",
        reason: reasonLabel(item.reason),
        status: caseStatusLabel(item.status),
        waitingOn: !isCaseOpen(item)
          ? "Closed"
          : needsAdminReply(item)
            ? "Admin"
            : "Seller",
      })),
    [cases, catalogById, shopById],
  );

  const open = rows.find((row) => row.item.id === openId);
  const myQueue = cases.filter(mode === "admin" ? needsAdminReply : needsSellerReply).length;

  useEffect(() => {
    if (!openId) return;
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [openId]);

  function closeDrawer() {
    setDrawerShown(false);
    window.setTimeout(() => setOpenId(null), 320);
  }

  const columns: Column<Row>[] = [
    {
      id: "product",
      header: "Product",
      value: (row) => row.productName,
      filter: { kind: "text", placeholder: "Name contains…" },
      render: (row) => (
        <div>
          <p className="font-medium">{row.productName}</p>
          <p className="text-xs text-stone-400">{row.item.listingId}</p>
        </div>
      ),
    },
    {
      id: "shop",
      header: "Dukkan",
      value: (row) => row.shopName,
      filter: { kind: "select" },
      defaultHidden: mode === "seller",
      render: (row) => (
        <ShopNameButton shopId={row.item.shopId}>{row.shopName}</ShopNameButton>
      ),
    },
    { id: "action", header: "Action", value: (row) => row.action, filter: { kind: "select" } },
    { id: "reason", header: "Reason", value: (row) => row.reason, filter: { kind: "select" } },
    {
      id: "status",
      header: "Status",
      value: (row) => row.status,
      filter: { kind: "select" },
      render: (row) => <StatusPill>{row.status}</StatusPill>,
    },
    {
      id: "waiting",
      header: "Waiting on",
      value: (row) => row.waitingOn,
      filter: { kind: "select" },
    },
    {
      id: "messages",
      header: "Messages",
      value: (row) => row.item.events.length,
      align: "right",
      defaultHidden: true,
    },
    {
      id: "opened",
      header: "Opened",
      value: (row) => row.item.createdAt,
      render: (row) => (
        <span className="text-xs text-stone-500">{formatDate(row.item.createdAt)}</span>
      ),
    },
    {
      id: "updated",
      header: "Last update",
      value: (row) => row.item.updatedAt,
      render: (row) => (
        <span className="text-xs text-stone-500">{formatDate(row.item.updatedAt)}</span>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        {mode === "admin" ? "Moderation queue" : "Hidden & overridden products"}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {mode === "admin"
          ? "Every hide and override with the explanation the seller was given. Answer disputes and republish requests here."
          : "Read why admin hid or changed a listing. Dispute the decision, or fix the listing and apply to republish."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={mode === "admin" ? "Needs your reply" : "Needs your action"}
          value={myQueue}
        />
        <StatCard label="Open cases" value={cases.filter(isCaseOpen).length} />
        <StatCard
          label="Republished"
          value={cases.filter((item) => item.status === "approved").length}
        />
        <StatCard label="Total cases" value={cases.length} />
      </div>

      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.item.id}
          onRowClick={(row) => setOpenId(row.item.id)}
          searchPlaceholder="Search product, dukkan, reason, explanation"
          searchText={(row) => `${row.item.explanation} ${row.item.id}`}
          initialSort={{ columnId: "updated", dir: "desc" }}
          emptyMessage={
            mode === "admin"
              ? "No listing has been hidden or overridden yet."
              : "None of your listings have been hidden or overridden."
          }
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close case"
            onClick={closeDrawer}
            className={`drawer-scrim absolute inset-0 bg-black/40 ${drawerShown ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-cream shadow-2xl ${
              drawerShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{open.productName}</h2>
                <p className="text-xs text-stone-500">
                  {open.shopName} · {open.item.id}
                </p>
              </div>
              <button type="button" className="text-sm text-stone-500" onClick={closeDrawer}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ModerationThread moderationCase={open.item} mode={mode} />
              <Link
                href={
                  mode === "admin"
                    ? adminConsolePath(`/products/${open.item.listingId}`)
                    : sellerConsolePath(`/products/${open.item.listingId}`)
                }
                className="mt-5 inline-block text-sm underline"
              >
                {mode === "admin" ? "Open product details" : "Edit this listing"}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
