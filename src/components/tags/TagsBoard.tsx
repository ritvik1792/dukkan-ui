"use client";

import { TagForm, formToTag, tagToForm, type TagFormValue } from "@/components/tags/TagForm";
import { TagBadge } from "@/components/TagBadge";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { titleCase } from "@/lib/format";
import { createId } from "@/lib/ids";
import { snapshotTag, tagRuleSummary } from "@/lib/tags";
import type { PromoTag, TagKind } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Panel = { mode: "create" } | { mode: "edit"; tagId: string };

export function TagsBoard({ mode }: { mode: "seller" | "admin" }) {
  const { user, state, dispatch, shopById } = useApp();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);

  const sellerShop =
    state.shops.find((shop) => shop.id === user?.shopId) ??
    state.shops.find((shop) => shop.ownerUserId === user?.id);

  const tags = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.promoTags.filter((tag) => {
      if (mode === "seller") {
        const own = sellerShop && tag.shopId === sellerShop.id;
        const platform = tag.owner === "admin";
        if (!own && !platform) return false;
      }
      if (kindFilter && tag.kind !== kindFilter) return false;
      if (statusFilter && tag.status !== statusFilter) return false;
      if (shopFilter && tag.shopId !== shopFilter) return false;
      if (!q) return true;
      const shop = tag.shopId ? shopById(tag.shopId)?.name ?? "" : "platform";
      return `${tag.label} ${tag.code ?? ""} ${tag.kind} ${shop} ${tagRuleSummary(tag)}`
        .toLowerCase()
        .includes(q);
    });
  }, [state.promoTags, mode, sellerShop, kindFilter, statusFilter, shopFilter, search, shopById]);

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
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-lime"
          onClick={() => setPanel({ mode: "create" })}
        >
          Add tag
        </button>
      </div>

      <div className={`mt-4 grid gap-3 ${mode === "admin" ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, code, shop"
          />
        </Field>
        <Field label="Type">
          <Select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
            <option value="">All types</option>
            {(["sale", "coupon", "offer", "badge"] as TagKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {titleCase(kind)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="taken_down">Taken down</option>
          </Select>
        </Field>
        {mode === "admin" && (
          <Field label="Dukkan">
            <Select value={shopFilter} onChange={(event) => setShopFilter(event.target.value)}>
              <option value="">All shops</option>
              {state.shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Tag</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => {
              const shop = tag.shopId ? shopById(tag.shopId) : undefined;
              return (
                <tr key={tag.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <TagBadge tag={snapshotTag(tag)} />
                    {tag.code && <p className="mt-1 text-xs text-stone-400">{tag.code}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{tag.owner === "admin" ? "Platform" : shop?.name ?? "Seller"}</p>
                    <p className="text-xs text-stone-400">{titleCase(tag.kind)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">{tagRuleSummary(tag)}</td>
                  <td className="px-4 py-3">{tag.listingIds.length}</td>
                  <td className="px-4 py-3">
                    <StatusPill>{titleCase(tag.status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => setPanel({ mode: "edit", tagId: tag.id })}
                      >
                        Open
                      </button>
                      {mode === "admin" && (
                        <button type="button" className="text-xs underline" onClick={() => takeDown(tag)}>
                          {tag.status === "taken_down" ? "Restore" : "Take down"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {tags.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No tags match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
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
