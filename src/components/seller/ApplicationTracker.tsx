"use client";

import {
  SellerIntentFields,
  emptySellerIntent,
  sellerIntentError,
  type SellerIntentValues,
} from "@/components/auth/SellerIntentFields";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import {
  createTicketRequest,
  isLocalApi,
  mapApplication,
  mapShop,
  mapTicket,
  patchApplicationRequest,
  patchShopRequest,
} from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import type { ApplicationStatus, Category, SellerApplication, Shop } from "@/lib/types";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type StepId = "submitted" | "review" | "live";

const STEPS: { id: StepId; n: number; label: string }[] = [
  { id: "submitted", n: 1, label: "Submitted" },
  { id: "review", n: 2, label: "Ops review" },
  { id: "live", n: 3, label: "Dukkan live" },
];

export function applicationChatSubject(applicationId: string) {
  return `Application ${applicationId}`;
}

function currentStep(status: ApplicationStatus): StepId {
  if (status === "approved") return "live";
  if (status === "submitted") return "submitted";
  return "review";
}

function stepTone(status: ApplicationStatus, id: StepId): "done" | "now" | "wait" | "back" {
  if (status === "approved") return "done";
  if (id === "live") return "wait";
  if (id === "submitted") return status === "submitted" ? "now" : "done";
  if (status === "rejected") return "back";
  if (status === "under_review") return "now";
  return "wait";
}

function toneLabel(tone: ReturnType<typeof stepTone>) {
  if (tone === "done") return "Done";
  if (tone === "now") return "Now";
  if (tone === "back") return "Changes asked";
  return "Waiting";
}

function selectionFrom(
  application: SellerApplication,
  shop: Shop | undefined,
  categories: Category[],
): SellerIntentValues {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const servicesOn = Boolean(shop?.servicesAllowed);
  const productCategoryIds: string[] = [];
  const serviceCategoryIds: string[] = [];
  for (const id of application.categoryIds) {
    const kind = byId.get(id)?.kind;
    if (kind === "SERVICE") serviceCategoryIds.push(id);
    else if (kind === "BOTH") {
      if (shop?.productsAllowed !== false) productCategoryIds.push(id);
      if (servicesOn) serviceCategoryIds.push(id);
    } else if (servicesOn && shop?.productsAllowed === false) serviceCategoryIds.push(id);
    else productCategoryIds.push(id);
  }
  return emptySellerIntent({
    productCategoryIds,
    provideServices: servicesOn || serviceCategoryIds.length > 0,
    serviceCategoryIds,
    businessName: application.businessName,
    address: application.address,
    gstin: application.gstin,
    notes: application.notes,
    partnerDelivery: shop?.partnerDeliveryEnabled ?? true,
    shopDelivery: shop?.shopDeliveryEnabled ?? true,
    providerType: shop?.providerType ?? "SERVICE_BUSINESS",
    profession: shop?.profession ?? "",
    serviceArea: shop?.serviceArea ?? "",
  });
}

function namesFor(ids: string[], categories: Category[], match: (category: Category) => boolean) {
  const names = ids
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is Category => Boolean(category && match(category)))
    .map((category) => category.name);
  return names.length ? names.join(", ") : "None selected";
}

export function ApplicationTracker({
  application,
  mode,
}: {
  application: SellerApplication;
  mode: "seller" | "admin";
}) {
  const { user, state, dispatch, shopById, locationLabel } = useApp();
  const { showAlert } = useAlert();
  const shop = shopById(application.shopId);
  const [step, setStep] = useState<StepId>(() => currentStep(application.status));
  const [editing, setEditing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [note, setNote] = useState(application.reviewNote ?? "");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<ApplicationStatus | "comment" | null>(null);
  const [copied, setCopied] = useState(false);
  const [intent, setIntent] = useState<SellerIntentValues>(() =>
    selectionFrom(application, shop, state.categories),
  );
  const [ownerName, setOwnerName] = useState(application.ownerName);
  const [email, setEmail] = useState(application.email);
  const [phone, setPhone] = useState(application.phone);

  useEffect(() => {
    setStep(currentStep(application.status));
    setNote(application.reviewNote ?? "");
    setEditing(false);
  }, [application.id, application.status, application.reviewNote]);

  const subject = applicationChatSubject(application.id);
  const ticket = useMemo(
    () =>
      state.tickets
        .filter((item) => item.subject === subject && !item.hidden)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [state.tickets, subject],
  );

  const canEdit = mode === "seller" && application.status !== "approved";
  const delivery = [
    shop?.partnerDeliveryEnabled ? "Dukkan partner delivery" : "",
    shop?.shopDeliveryEnabled ? "Deliver ourselves" : "",
  ].filter(Boolean);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(application.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showAlert({ tone: "info", title: "Submission id", message: application.id });
    }
  }

  function startEdit() {
    setIntent(selectionFrom(application, shop, state.categories));
    setOwnerName(application.ownerName);
    setEmail(application.email);
    setPhone(application.phone);
    setEditing(true);
    setStep("submitted");
  }

  async function saveEdits(event: FormEvent) {
    event.preventDefault();
    const intentError = sellerIntentError(intent, true);
    if (intentError) {
      showAlert({ tone: "info", title: "Check the form", message: intentError });
      return;
    }
    if (!ownerName.trim() || !email.trim() || !phone.trim()) {
      showAlert({ tone: "info", title: "Check the form", message: "Owner name, email, and phone are required." });
      return;
    }
    const categoryIds = Array.from(
      new Set([
        ...intent.productCategoryIds,
        ...(intent.provideServices ? intent.serviceCategoryIds : []),
      ]),
    );
    setBusy(true);
    try {
      const updated = await patchApplicationRequest(application.id, {
        businessName: intent.businessName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: intent.address.trim(),
        gstin: intent.gstin.trim(),
        categoryIds,
        notes: intent.notes.trim(),
        profession: intent.provideServices ? intent.profession.trim() : "",
        serviceArea: intent.provideServices ? intent.serviceArea.trim() : "",
        partnerDeliveryEnabled: intent.partnerDelivery,
        shopDeliveryEnabled: intent.shopDelivery,
        lat: intent.pin?.coordinates.lat,
        lng: intent.pin?.coordinates.lng,
      });
      dispatch({ type: "upsertApplication", application: mapApplication(updated) });
      if (shop) {
        const rawShop = await patchShopRequest(shop.id, {
          profession: intent.provideServices ? intent.profession.trim() : "",
          serviceArea: intent.provideServices ? intent.serviceArea.trim() : "",
          categoryIds,
          partnerDeliveryEnabled: intent.partnerDelivery,
          shopDeliveryEnabled: intent.shopDelivery,
        });
        dispatch({ type: "upsertShop", shop: mapShop(rawShop) });
      }
      if (user && user.id === application.userId) {
        dispatch({
          type: "upsertUser",
          user: { ...user, name: ownerName.trim(), email: email.trim(), phone: phone.trim() },
        });
      }
      setEditing(false);
      setStep("review");
      showAlert({
        tone: "success",
        title: "Application updated",
        message: "Ops can see this submission again. The id stays the same.",
      });
    } catch (err) {
      showAlert({
        tone: "info",
        title: "Could not save",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveReview(status?: ApplicationStatus) {
    setPendingAction(status ?? "comment");
    setBusy(true);
    try {
      const patch = {
        reviewNote: note,
        ...(status ? { status } : {}),
      };
      let mapped = {
        ...application,
        reviewNote: note,
        ...(status ? { status } : {}),
      };
      try {
        mapped = mapApplication(await patchApplicationRequest(application.id, patch));
      } catch (err) {
        if (!isLocalApi(err)) throw err;
      }
      dispatch({ type: "upsertApplication", application: mapped });
      if (status === "approved" || mapped.status === "approved") {
        dispatch({ type: "setShopStatus", shopId: application.shopId, status: "active" });
        showAlert({ tone: "success", title: "Shop approved", message: "This dukkan is live." });
      } else if (status === "rejected") {
        dispatch({ type: "setShopStatus", shopId: application.shopId, status: "pending" });
        showAlert({ tone: "info", title: "Sent back", message: "The seller can edit and resubmit this id." });
      } else if (status === "under_review") {
        showAlert({ tone: "info", title: "Marked under review" });
      } else {
        showAlert({ tone: "success", title: "Comment saved" });
      }
    } catch (err) {
      showAlert({
        tone: "info",
        title: "Could not update",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  async function sendChat() {
    const body = draft.trim();
    if (!user || !body) return;
    setBusy(true);
    try {
      if (ticket) {
        return;
      }
      const created = await createTicketRequest({
        kind: "support",
        subject,
        shopId: application.shopId,
        body,
      });
      dispatch({ type: "upsertTicket", ticket: mapTicket(created) });
      setDraft("");
    } catch (err) {
      showAlert({
        tone: "info",
        title: "Message not sent",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{application.businessName}</h2>
          <p className="text-sm text-stone-500">
            {application.ownerName} · {application.email}
          </p>
        </div>
        <StatusPill>{titleCase(application.status)}</StatusPill>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="font-medium text-ink">Submission {application.id}</span>
        <button type="button" className="underline" onClick={() => void copyId()}>
          {copied ? "Copied" : "Copy id"}
        </button>
        <span>Submitted {formatDate(application.submittedAt)}</span>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {STEPS.map((item) => {
          const tone = stepTone(application.status, item.id);
          const open = step === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={open}
                onClick={() => {
                  setStep(item.id);
                  setEditing(false);
                }}
                className={`w-full rounded-2xl border px-3 py-3 text-left ${
                  open ? "border-ink bg-cream" : "border-stone-200 bg-white"
                }`}
              >
                <span className="text-xs text-stone-500">
                  {item.n}. {toneLabel(tone)}
                </span>
                <span className="mt-0.5 block text-sm font-semibold">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-2xl bg-cream/70 p-4">
        {step === "submitted" && !editing && (
          <SubmittedForm
            application={application}
            categories={state.categories}
            delivery={delivery}
            profession={shop?.profession}
            serviceArea={shop?.serviceArea}
          />
        )}
        {step === "submitted" && editing && (
          <form onSubmit={(event) => void saveEdits(event)} className="space-y-4">
            <p className="text-sm text-stone-600">
              Update what ops should review. Saving keeps submission {application.id} and sends it back as submitted.
            </p>
            <Field label="Owner name">
              <TextInput required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <SellerIntentFields
              categories={state.categories}
              values={intent}
              onChange={setIntent}
              locationLabel={locationLabel}
              mode="apply"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving" : "Save and resubmit"}
              </button>
              <button
                type="button"
                className="rounded-full border px-4 py-2 text-sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {step === "review" && (
          <ReviewPanel
            application={application}
            mode={mode}
            note={note}
            busy={busy}
            onNote={setNote}
            onSave={(status) => void saveReview(status)}
            pendingAction={pendingAction}
          />
        )}
        {step === "live" && <LivePanel application={application} shop={shop} />}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canEdit && !editing && (
          <button
            type="button"
            className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white"
            onClick={startEdit}
          >
            Edit application
          </button>
        )}
        <button
          type="button"
          className="rounded-full border px-4 py-2 text-sm font-semibold"
          onClick={() => setChatOpen((open) => !open)}
        >
          {chatOpen ? "Hide chat" : mode === "admin" ? "Chat with seller" : "Chat with admin"}
        </button>
      </div>

      {chatOpen && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-stone-500">
            Messages stay on submission {application.id}
            {ticket ? ` · ticket ${ticket.id}` : ""}. Admin tracks the same thread in Support.
          </p>
          {ticket ? (
            <TicketThread ticket={ticket} canAssign={mode === "admin"} />
          ) : (
            <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
              <TextArea
                rows={3}
                placeholder={mode === "admin" ? "Message the seller" : "Ask admin about this application"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !draft.trim()}
                className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void sendChat()}
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function SubmittedForm({
  application,
  categories,
  delivery,
  profession,
  serviceArea,
}: {
  application: SellerApplication;
  categories: Category[];
  delivery: string[];
  profession?: string;
  serviceArea?: string;
}) {
  const serviceCategories = namesFor(
    application.categoryIds,
    categories,
    (category) => category.kind === "SERVICE" || category.kind === "BOTH",
  );
  const rows = [
    ["Owner", application.ownerName],
    ["Email", application.email],
    ["Phone", application.phone],
    ["Shop", application.businessName],
    ["Address", application.address],
    ["GSTIN", application.gstin || "Not provided"],
    [
      "Shop categories",
      namesFor(application.categoryIds, categories, (category) => category.kind !== "SERVICE"),
    ],
    ["Service categories", serviceCategories === "None selected" ? "" : serviceCategories],
    ["Delivery", delivery.length ? delivery.join(", ") : "None selected"],
    ["Profession", profession ?? ""],
    ["Service area", serviceArea ?? ""],
    ["About", application.notes],
  ].filter(([, value]) => value.trim().length > 0);
  return (
    <div>
      <p className="text-sm font-semibold">What was submitted</p>
      <p className="mt-1 text-sm text-stone-600">
        This is the form ops is reviewing. Open Ops review for comments and what to change.
      </p>
      <dl className="mt-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-0.5 border-b border-white/80 py-2 sm:grid-cols-[9rem_1fr]">
            <dt className="text-xs font-medium text-stone-500">{label}</dt>
            <dd className="text-sm whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ReviewPanel({
  application,
  mode,
  note,
  busy,
  pendingAction,
  onNote,
  onSave,
}: {
  application: SellerApplication;
  mode: "seller" | "admin";
  note: string;
  busy: boolean;
  pendingAction: ApplicationStatus | "comment" | null;
  onNote: (value: string) => void;
  onSave: (status?: ApplicationStatus) => void;
}) {
  const waiting =
    application.status === "submitted"
      ? "Ops has not opened this yet. You can still edit the form."
      : application.status === "under_review"
        ? "Ops is checking this shop. Their comment says what to change."
        : application.status === "rejected"
          ? "Ops sent this back. Edit the form and save to submit the same id again."
          : "Ops approved this application.";

  return (
    <div>
      <p className="text-sm font-semibold">Ops review</p>
      <p className="mt-1 text-sm text-stone-600">{waiting}</p>
      <p className="mt-3 text-xs font-medium text-stone-500">Status</p>
      <p className="text-sm">{titleCase(application.status)}</p>
      <p className="mt-3 text-xs font-medium text-stone-500">Comment from admin</p>
      {mode === "admin" ? (
        <div className="mt-1 space-y-3">
          <TextArea
            rows={3}
            value={note}
            placeholder="What should the seller change?"
            onChange={(e) => onNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className="rounded-full border px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => onSave()}
            >
              {pendingAction === "comment" ? "Saving…" : "Save comment"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-full border px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => onSave("under_review")}
            >
              {pendingAction === "under_review" ? "Saving…" : "Under review"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-full bg-carrot px-3 py-1.5 text-xs text-white disabled:opacity-60"
              onClick={() => onSave("approved")}
            >
              {pendingAction === "approved" ? "Approving…" : "Approve shop"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-full border px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => onSave("rejected")}
            >
              {pendingAction === "rejected" ? "Sending…" : "Send back"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm whitespace-pre-wrap">
          {application.reviewNote || "No comment yet. Use chat if you need to ask admin something."}
        </p>
      )}
    </div>
  );
}

function LivePanel({ application, shop }: { application: SellerApplication; shop?: Shop }) {
  if (application.status === "approved") {
    return (
      <div>
        <p className="text-sm font-semibold">Dukkan live</p>
        <p className="mt-1 text-sm text-stone-600">
          {shop?.name ?? application.businessName} is live for buyers. Shop status:{" "}
          {shop ? titleCase(shop.status) : "active"}.
        </p>
        <Link href={`/shop/${application.shopId}`} className="mt-3 inline-block text-sm underline">
          Open the dukkan
        </Link>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm font-semibold">Dukkan live</p>
      <p className="mt-1 text-sm text-stone-600">
        This step opens after ops approves the shop. Comments and changes stay on Ops review.
      </p>
    </div>
  );
}
