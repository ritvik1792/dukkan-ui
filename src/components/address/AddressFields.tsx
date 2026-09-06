"use client";

import { Field, TextInput } from "@/components/ui/Field";

export type AddressDraft = {
  label: string;
  line: string;
  pinCode: string;
};

export function emptyAddressDraft(): AddressDraft {
  return { label: "Home", line: "", pinCode: "" };
}

export function AddressFields({
  value,
  onChange,
}: {
  value: AddressDraft;
  onChange: (next: AddressDraft) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Label">
        <TextInput
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="Home, Work"
        />
      </Field>
      <Field label="Address">
        <textarea
          required
          rows={3}
          value={value.line}
          onChange={(e) => onChange({ ...value, line: e.target.value })}
          placeholder="House, street, area, city"
          className="w-full rounded-xl border border-stone-200 px-3 py-2 transition duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-lime/40"
        />
      </Field>
      <Field label="PIN code">
        <TextInput
          required
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          value={value.pinCode}
          onChange={(e) => onChange({ ...value, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
        />
      </Field>
    </div>
  );
}
