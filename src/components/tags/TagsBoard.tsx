"use client";

import { ShopNameButton } from "@/components/shops/ShopPeek";
import { TagForm, formToTag, tagToForm, type TagFormValue } from "@/components/tags/TagForm";
import { TagBadge } from "@/components/TagBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { formatDate, titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import { snapshotTag, tagRuleSummary } from "@/lib/tags";
import type { PromoTag } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Panel = { mode: "create" } | { mode: "edit"; tagId: string };

type Row = {
  tag: PromoTag;
  ownerName: string;
  kind: string;
  rule: string;
  status: string;
};

export function TagsBoard({ mode }: { mode: "seller" | "admin" }) {
  const { user, state, dispatch, shopById } = useApp();
  const { showAlert } = useAlert();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);

  const sellerShop =
    state.shops.find((shop) => shop.id === user?.shopId) ??
    state.shops.find((shop) => shop.ownerUserId === user?.id);

  const rows = useMemo<Row[]>(
    () =>
      state.promoTags
        .filter((tag) => {
          if (mode === "admin") return true;
          const own = sellerShop && tag.shopId === sellerShop.id;
          return Boolean(own) || tag.owner === "admin";
        })
        .map((tag) => ({
          tag,
          ownerName:
            tag.owner === "admin"
              ? "Platform"
              : (tag.shopId ? shopById(tag.shopId)?.name : undefined) ?? "Seller",
          kind: titleCase(tag.kind),
          rule: tagRuleSummary(tag),
          status: titleCase(tag.status),
        })),
    [state.promoTags, mode, sellerShop, shopById],
  );

  const editing = panel?.mode === "edit" ? state.promoTags.find((tag) => tag.id === panel.tagId) : undefined;

  useEffect(() => {
    if (!panel) return;
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [panel]);

  function closePanel() {
    setDrawerShown(false);
    window.setTimeout(() => setPanel(null), 320);
  }

  function save(form: TagFormValue, existing?: PromoTag) {
    if (!user) return;
    const owner = existing?.owner ?? (mode === "admin" ? "admin" : "seller");
    const shopId =
      owner === "admin" ? existing?.shopId : (existing?.shopId ?? sellerShop?.id);
    if (owner === "seller" && !shopId) return;
    const listingIds =
      mode === "seller" && existing?.owner === "admin" && sellerShop
        ? [
            ...existing.listingIds.filter((id) => {
              const listing = state.listings.find((item) => item.id === id);
              return listing && listing.shopId !== sellerShop.id;
            }),
            ...form.listingIds.filter((id) => {
              const listing = state.listings.find((item) => item.id === id);
              return listing?.shopId === sellerShop.id;
            }),
          ]
        : form.listingIds;
    dispatch({
      type: "upsertPromoTag",
      tag: formToTag(
        { ...form, listingIds },
        {
          id: existing?.id ?? createId("tag"),
          owner,
          shopId,
          createdByUserId: existing?.createdByUserId ?? user.id,
          status: existing?.status ?? "active",
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        },
      ),
    });
    showAlert({
      tone: "success",
      title: existing ? "Tag saved" : "Tag created",
      message: existing ? undefined : "Attach or remove products anytime from this tag.",
    });
    closePanel();
  }

  function takeDown(tag: PromoTag) {
    const next = tag.status === "taken_down" ? "active" : "taken_down";
    dispatch({ type: "setPromoTagStatus", tagId: tag.id, status: next });
    showAlert({
      tone: "success",
      title: next === "taken_down" ? "Tag taken down" : "Tag restored",
      message:
        next === "taken_down"
          ? "Hidden from buyers and sellers can no longer attach it."
          : "Sellers can use this tag again.",
    });
  }

  const columns: Column<Row>[] = [
    {
      id: "tag",
      header: "Tag",
      value: (row) => row.tag.label,
      filter: { kind: "text", placeholder: "Label contains…" },
      render: (row) => (
        <div>
          <TagBadge tag={snapshotTag(row.tag)} />
          {row.tag.code && <p className="mt-1 text-xs text-stone-400">{row.tag.code}</p>}
        </div>
      ),
    },
    {
      id: "code",
      header: "Code",
      value: (row) => row.tag.code ?? "",
      filter: { kind: "text", placeholder: "Code contains…" },
      defaultHidden: true,
      render: (row) => row.tag.code ?? "—",
    },
    { id: "kind", header: "Type", value: (row) => row.kind, filter: { kind: "select" } },
    {
      id: "owner",
      header: "Owner",
      value: (row) => row.ownerName,
      filter: { kind: "select" },
      render: (row) =>
        row.tag.owner === "admin" ? (
          row.ownerName
        ) : (
          <ShopNameButton shopId={row.tag.shopId}>{row.ownerName}</ShopNameButton>
        ),
    },
    {
      id: "rule",
      header: "Rule",
      value: (row) => row.rule,
      sortable: false,
      render: (row) => <span className="text-xs text-stone-600">{row.rule}</span>,
    },
    {
      id: "products",
      header: "Products",
      value: (row) => row.tag.listingIds.length,
      filter: { kind: "range" },
      align: "right",
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
      header: "Created",
      value: (row) => row.tag.createdAt,
      defaultHidden: true,
      render: (row) => (
        <span className="text-xs text-stone-500">{formatDate(row.tag.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      value: () => "",
      sortable: false,
      searchable: false,
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="text-xs underline"
            onClick={() => setPanel({ mode: "edit", tagId: row.tag.id })}
          >
            Open
          </button>
          {mode === "admin" && (
            <button type="button" className="text-xs underline" onClick={() => takeDown(row.tag)}>
              {row.tag.status === "taken_down" ? "Restore" : "Take down"}
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {mode === "admin" ? "Tags, sales & coupons" : "Sales & coupons"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {mode === "admin"
              ? "Create platform tags, watch every seller tag, and take one down if it should not stay live."
              : "Create a sale, coupon, offer, or badge, then attach products. You can also use platform tags from admin."}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setPanel({ mode: "create" })}
        >
          Add tag
        </button>
      </div>

      <div className="mt-4">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.tag.id}
          onRowClick={(row) => setPanel({ mode: "edit", tagId: row.tag.id })}
          searchPlaceholder="Search label, code, type, dukkan, rule"
          searchText={(row) => `${row.tag.id} ${row.rule}`}
          initialSort={{ columnId: "created", dir: "desc" }}
          emptyMessage="No tags match these filters."
        />
      </div>

      {panel && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close panel"
            onClick={closePanel}
            className={`drawer-scrim absolute inset-0 bg-black/40 ${drawerShown ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-cream shadow-2xl ${
              drawerShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {panel.mode === "create" ? "Add tag" : editing?.label ?? "Tag"}
                </h2>
                <p className="text-xs text-stone-500">
                  {panel.mode === "create"
                    ? "Set the rule, then attach products."
                    : "See attached products and change the rule or attachments."}
                </p>
              </div>
              <button type="button" className="text-sm text-stone-500" onClick={closePanel}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {panel.mode === "create" ? (
                <TagForm
                  shopId={mode === "seller" ? sellerShop?.id : undefined}
                  submitLabel="Create tag"
                  onSubmit={(form) => save(form)}
                />
              ) : editing ? (
                <TagForm
                  key={editing.id}
                  initial={
                    mode === "seller" && editing.owner === "admin" && sellerShop
                      ? {
                          ...tagToForm(editing),
                          listingIds: editing.listingIds.filter((id) => {
                            const listing = state.listings.find((item) => item.id === id);
                            return listing?.shopId === sellerShop.id;
                          }),
                        }
                      : tagToForm(editing)
                  }
                  shopId={mode === "seller" ? sellerShop?.id : undefined}
                  lockRules={mode === "seller" && editing.owner === "admin"}
                  submitLabel="Save tag"
                  onSubmit={(form) => save(form, editing)}
                />
              ) : (
                <p className="text-sm text-stone-500">Tag not found.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
