import type { DeliveryMode } from "@/lib/types";
import { PARTNER_ETA_MINUTES } from "@/lib/constants";

export function DeliveryPicker({
  modes,
  value,
  onChange,
}: {
  modes: DeliveryMode[];
  value: DeliveryMode;
  onChange: (mode: DeliveryMode) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {modes.includes("partner") && (
        <button
          type="button"
          onClick={() => onChange("partner")}
          className={`rounded-2xl border p-4 text-left ${
            value === "partner"
              ? "border-ink bg-ink text-white"
              : "border-stone-200 bg-white"
          }`}
        >
          <p className="text-sm font-semibold">Dukkan partner</p>
          <p className={`mt-1 text-xs ${value === "partner" ? "text-white/70" : "text-stone-500"}`}>
            Rider network · typically {PARTNER_ETA_MINUTES} min inside radius
          </p>
        </button>
      )}
      {modes.includes("shop") && (
        <button
          type="button"
          onClick={() => onChange("shop")}
          className={`rounded-2xl border p-4 text-left ${
            value === "shop"
              ? "border-ink bg-ink text-white"
              : "border-stone-200 bg-white"
          }`}
        >
          <p className="text-sm font-semibold">Shop delivery</p>
          <p className={`mt-1 text-xs ${value === "shop" ? "text-white/70" : "text-stone-500"}`}>
            The dukkan sends its own rider or tempo
          </p>
        </button>
      )}
    </div>
  );
}
