"use client";

import { Field, TextArea } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { MODERATION_REASONS } from "@/services/moderation";
import type { ModerationAction, ModerationReason } from "@/lib/types";
import { useState } from "react";

const MIN_EXPLANATION = 20;

/**
 * Admin cannot hide or override a listing silently — this collects the reason the seller will
 * see, and which they can dispute or answer with a republish request.
 */
export function ModerationDialog({
  action,
  productName,
  shopName,
  onCancel,
  onConfirm,
}: {
  action: ModerationAction;
  productName: string;
  shopName: string;
  onCancel: () => void;
  onConfirm: (input: { reason: ModerationReason; explanation: string }) => void;
}) {
  const [reason, setReason] = useState<ModerationReason>("policy");
  const [explanation, setExplanation] = useState("");
  const [touched, setTouched] = useState(false);

  const tooShort = explanation.trim().length < MIN_EXPLANATION;
  const hint = MODERATION_REASONS.find((item) => item.value === reason)?.hint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40"
      />
      <div className="animate-pop-in relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">
          {action === "hide" ? "Hide this product" : "Override this product"}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {productName} · {shopName}
        </p>
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs text-stone-600">
          {action === "hide"
            ? "The listing leaves the storefront and the seller gets your explanation. They can dispute it or apply to republish once fixed."
            : "Your edits replace the seller listing. They get your explanation and can dispute it or apply to republish their own version."}
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Reason" hint={hint}>
            <SearchSelect
              value={reason}
              onChange={(value) => setReason(value as ModerationReason)}
              options={MODERATION_REASONS.map((item) => ({
                value: item.value,
                label: item.label,
                hint: item.hint,
              }))}
              searchPlaceholder="Search reasons"
            />
          </Field>
          <Field
            label="Explanation for the seller"
            hint={`${explanation.trim().length}/${MIN_EXPLANATION} min`}
          >
            <TextArea
              rows={4}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Say exactly what is wrong and what would make this listing publishable again."
            />
          </Field>
          {touched && tooShort && (
            <p className="text-xs text-red-700">
              Write at least {MIN_EXPLANATION} characters so the seller knows what to fix.
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={tooShort}
            onClick={() => onConfirm({ reason, explanation: explanation.trim() })}
            className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {action === "hide" ? "Hide product" : "Continue to override"}
          </button>
        </div>
      </div>
    </div>
  );
}
