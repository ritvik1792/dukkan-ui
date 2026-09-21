"use client";

import { AdForm, adToForm, blankAdForm, type AdFormValue } from "@/components/ads/AdForm";
import {
  PlacementForm,
  placementToForm,
  blankPlacementForm,
  type PlacementFormValue,
} from "@/components/ads/PlacementForm";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatCard, StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { formatDate } from "@/lib/format";
import { createId } from "@/lib/ids";
import type { AdPlacement, Advertisement } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Section = "ads" | "placements";

type Panel =
  | { kind: "ad"; adId?: string }
  | { kind: "placement"; placementId?: string };

type AdRow = {
  ad: Advertisement;
  placementName: string;
  productName: string;
  status: string;
  schedule: string;
};

type PlacementRow = {
  placement: AdPlacement;
  adCount: number;
  activeAdCount: number;
  status: string;
};

function scheduleLabel(ad: Advertisement) {
  if (!ad.startsAt && !ad.endsAt) return "Always on";
  const from = ad.startsAt ? formatDate(ad.startsAt) : "now";
  const to = ad.endsAt ? formatDate(ad.endsAt) : "no end";
  return `${from} → ${to}`;
}

export default function AdminAdsPage() {
  const { state, dispatch, catalogById } = useApp();
  const { showAlert } = useAlert();
  const [section, setSection] = useState<Section>("ads");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);

  useEffect(() => {
    if (!panel) return;
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [panel]);

  function closePanel() {
    setDrawerShown(false);
    window.setTimeout(() => setPanel(null), 320);
  }

  const adRows = useMemo<AdRow[]>(
    () =>
      state.advertisements.map((ad) => ({
        ad,
        placementName:
          state.adPlacements.find((placement) => placement.id === ad.placementId)?.label ??
          "Unassigned",
        productName: ad.catalogProductId
          ? (catalogById(ad.catalogProductId)?.name ?? "—")
          : "—",
        status: ad.active ? "Active" : "Paused",
        schedule: scheduleLabel(ad),
      })),
    [state.advertisements, state.adPlacements, catalogById],
  );

  const placementRows = useMemo<PlacementRow[]>(
    () =>
      state.adPlacements.map((placement) => {
        const ads = state.advertisements.filter((ad) => ad.placementId === placement.id);
        return {
          placement,
          adCount: ads.length,
          activeAdCount: ads.filter((ad) => ad.active).length,
          status: placement.active ? "Active" : "Paused",
        };
      }),
    [state.adPlacements, state.advertisements],
  );

  const editingAd = panel?.kind === "ad" && panel.adId
    ? state.advertisements.find((ad) => ad.id === panel.adId)
    : undefined;
  const editingPlacement =
    panel?.kind === "placement" && panel.placementId
      ? state.adPlacements.find((placement) => placement.id === panel.placementId)
      : undefined;

  function saveAd(form: AdFormValue) {
    const existing = editingAd;
    dispatch({
      type: "upsertAd",
      ad: {
        id: existing?.id ?? createId("ad"),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        cta: form.cta.trim(),
        href: form.href.trim(),
        badge: form.badge.trim(),
        hue: form.hue,
        catalogProductId: form.catalogProductId || undefined,
        active: form.active,
        imageUrl: form.imageUrl || undefined,
        placementId: form.placementId || undefined,
        weight: form.weight,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      },
    });
    showAlert({ tone: "success", title: existing ? "Ad saved" : "Ad uploaded" });
    closePanel();
  }

  function savePlacement(form: PlacementFormValue) {
    const existing = editingPlacement;
    dispatch({
      type: "upsertAdPlacement",
      placement: {
        id: existing?.id ?? createId("plc"),
        label: form.label.trim(),
        slug: form.slug,
        description: form.description.trim(),
        rotationSeconds: form.rotationSeconds,
        maxAds: form.maxAds,
        active: form.active,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      },
    });
    showAlert({
      tone: "success",
      title: existing ? "Placement saved" : "Placement created",
      message: `Ads in this slot rotate every ${form.rotationSeconds}s.`,
    });
    closePanel();
  }

  const adColumns: Column<AdRow>[] = [
    {
      id: "ad",
      header: "Ad",
      value: (row) => row.ad.title,
      filter: { kind: "text", placeholder: "Title contains…" },
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.ad.imageUrl} alt="" className="h-10 w-16 rounded-lg object-cover" />
          ) : (
            <span
              className="h-10 w-16 rounded-lg"
              style={{
                background: `linear-gradient(160deg, hsl(${row.ad.hue} 70% 88%), hsl(${row.ad.hue} 55% 72%))`,
              }}
            />
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium">{row.ad.title}</span>
            <span className="block truncate text-xs text-stone-400">{row.ad.subtitle}</span>
          </span>
        </div>
      ),
    },
    {
      id: "placement",
      header: "Placement tag",
      value: (row) => row.placementName,
      filter: { kind: "select" },
    },
    { id: "badge", header: "Badge", value: (row) => row.ad.badge, filter: { kind: "select" } },
    {
      id: "product",
      header: "Linked product",
      value: (row) => row.productName,
      filter: { kind: "select" },
      defaultHidden: true,
    },
    {
      id: "href",
      header: "Link",
      value: (row) => row.ad.href,
      filter: { kind: "text", placeholder: "Path contains…" },
      defaultHidden: true,
    },
    {
      id: "weight",
      header: "Weight",
      value: (row) => row.ad.weight ?? 1,
      filter: { kind: "range" },
      align: "right",
    },
    {
      id: "schedule",
      header: "Schedule",
      value: (row) => row.schedule,
      defaultHidden: true,
    },
    {
      id: "status",
      header: "Status",
      value: (row) => row.status,
      filter: { kind: "select" },
      render: (row) => <StatusPill>{row.status}</StatusPill>,
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
            className="rounded-full border border-stone-200 px-3 py-1 text-xs"
            onClick={() =>
              dispatch({ type: "upsertAd", ad: { ...row.ad, active: !row.ad.active } })
            }
          >
            {row.ad.active ? "Pause" : "Activate"}
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-200 px-3 py-1 text-xs text-red-700"
            onClick={() => {
              dispatch({ type: "deleteAd", adId: row.ad.id });
              showAlert({ tone: "success", title: "Ad removed" });
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const placementColumns: Column<PlacementRow>[] = [
    {
      id: "label",
      header: "Tag",
      value: (row) => row.placement.label,
      filter: { kind: "text", placeholder: "Name contains…" },
      render: (row) => (
        <div>
          <p className="font-medium">{row.placement.label}</p>
          <p className="text-xs text-stone-400">{row.placement.slug}</p>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      value: (row) => row.placement.description,
      sortable: false,
      render: (row) => (
        <span className="text-xs text-stone-500">{row.placement.description || "—"}</span>
      ),
    },
    {
      id: "rotation",
      header: "Rotation",
      value: (row) => row.placement.rotationSeconds,
      filter: { kind: "range" },
      align: "right",
      render: (row) => `${row.placement.rotationSeconds}s`,
    },
    {
      id: "maxAds",
      header: "Max ads",
      value: (row) => row.placement.maxAds,
      filter: { kind: "range" },
      align: "right",
    },
    {
      id: "booked",
      header: "Booked",
      value: (row) => row.adCount,
      align: "right",
      render: (row) => `${row.activeAdCount} active / ${row.adCount}`,
    },
    {
      id: "status",
      header: "Status",
      value: (row) => row.status,
      filter: { kind: "select" },
      render: (row) => <StatusPill>{row.status}</StatusPill>,
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
            className="rounded-full border border-stone-200 px-3 py-1 text-xs"
            onClick={() =>
              dispatch({
                type: "upsertAdPlacement",
                placement: { ...row.placement, active: !row.placement.active },
              })
            }
          >
            {row.placement.active ? "Pause" : "Activate"}
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-200 px-3 py-1 text-xs text-red-700"
            onClick={() => {
              dispatch({ type: "deleteAdPlacement", placementId: row.placement.id });
              showAlert({
                tone: "success",
                title: "Placement deleted",
                message: "Its ads are now unassigned and will not rotate anywhere.",
              });
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const activeAds = state.advertisements.filter((ad) => ad.active).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ads</h1>
          <p className="mt-1 text-sm text-stone-500">
            Define placement tags with their own rotation settings, then upload ads and book them
            into a tag.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-lime"
          onClick={() =>
            setPanel(section === "ads" ? { kind: "ad" } : { kind: "placement" })
          }
        >
          {section === "ads" ? "Upload ad" : "Add placement tag"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ads" value={state.advertisements.length} hint={`${activeAds} active`} />
        <StatCard
          label="Placement tags"
          value={state.adPlacements.length}
          hint={`${state.adPlacements.filter((p) => p.active).length} active`}
        />
        <StatCard
          label="Unassigned ads"
          value={state.advertisements.filter((ad) => !ad.placementId).length}
          hint="Not booked into any slot"
        />
        <StatCard
          label="Fastest rotation"
          value={
            state.adPlacements.length
              ? `${Math.min(...state.adPlacements.map((p) => p.rotationSeconds))}s`
              : "—"
          }
        />
      </div>

      <div className="mt-6 inline-flex rounded-full bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setSection("placements")}
          className={`rounded-full px-4 py-1.5 ${
            section === "placements" ? "bg-ink font-semibold text-lime" : "text-stone-600"
          }`}
        >
          Placement tags & rotation
        </button>
        <button
          type="button"
          onClick={() => setSection("ads")}
          className={`rounded-full px-4 py-1.5 ${
            section === "ads" ? "bg-ink font-semibold text-lime" : "text-stone-600"
          }`}
        >
          Ads
        </button>
      </div>

      <div className="mt-4">
        {section === "ads" ? (
          <DataTable
            rows={adRows}
            columns={adColumns}
            rowKey={(row) => row.ad.id}
            onRowClick={(row) => setPanel({ kind: "ad", adId: row.ad.id })}
            searchPlaceholder="Search title, subtitle, badge, placement, link"
            searchText={(row) => `${row.ad.subtitle} ${row.ad.href} ${row.ad.id}`}
            initialSort={{ columnId: "weight", dir: "desc" }}
            emptyMessage="No ads yet. Upload one to start a rotation."
          />
        ) : (
          <DataTable
            rows={placementRows}
            columns={placementColumns}
            rowKey={(row) => row.placement.id}
            onRowClick={(row) =>
              setPanel({ kind: "placement", placementId: row.placement.id })
            }
            searchPlaceholder="Search tag name, slug, description"
            initialSort={{ columnId: "label", dir: "asc" }}
            emptyMessage="No placement tags yet. Define one before uploading ads."
          />
        )}
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
                  {panel.kind === "ad"
                    ? (editingAd?.title ?? "Upload ad")
                    : (editingPlacement?.label ?? "Add placement tag")}
                </h2>
                <p className="text-xs text-stone-500">
                  {panel.kind === "ad"
                    ? "Upload the creative, then tag it with the placement it should run in."
                    : "Name the slot and set how long each ad stays on screen."}
                </p>
              </div>
              <button type="button" className="text-sm text-stone-500" onClick={closePanel}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {panel.kind === "ad" ? (
                <AdForm
                  key={editingAd?.id ?? "new-ad"}
                  placements={state.adPlacements}
                  initial={editingAd ? adToForm(editingAd) : blankAdForm()}
                  submitLabel={editingAd ? "Save ad" : "Upload ad"}
                  onSubmit={saveAd}
                />
              ) : (
                <PlacementForm
                  key={editingPlacement?.id ?? "new-placement"}
                  initial={
                    editingPlacement ? placementToForm(editingPlacement) : blankPlacementForm()
                  }
                  submitLabel={editingPlacement ? "Save placement" : "Create placement"}
                  onSubmit={savePlacement}
                />
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
