"use client";

import { LocationCapture } from "@/components/location/LocationCapture";
import { Field, TextInput } from "@/components/ui/Field";
import type { Coordinates } from "@/lib/types";

export type AddressDraft = {
  label: string;
  line: string;
  pinCode: string;
  coordinates?: Coordinates;
  accuracyM?: number;
};

export function emptyAddressDraft(): AddressDraft {
  return { label: "Home", line: "", pinCode: "" };
}

function pinFromPostcode(postcode?: string | null) {
  if (!postcode) return "";
  const digits = postcode.replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(0, 6) : digits;
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
          className="w-full rounded-xl border border-border px-3 py-2 transition duration-200 focus:border-ink focus:outline-none focus:ring-2 focus:ring-pink/40"
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
      <LocationCapture
        label="GPS for this address"
        hint="Optional. Lets the rider find the doorstep instead of guessing from the PIN code."
        value={value.coordinates}
        accuracyM={value.accuracyM}
        onCapture={(coordinates, accuracyM, address) =>
          onChange({
            ...value,
            coordinates,
            accuracyM,
            line: address?.formattedAddress || value.line,
            pinCode: pinFromPostcode(address?.postcode) || value.pinCode,
          })
        }
        onClear={() => onChange({ ...value, coordinates: undefined, accuracyM: undefined })}
      />
    </div>
  );
}
