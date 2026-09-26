import type { DeliveryMode, Shop } from "@/lib/types";
import { shopDeliveryModes } from "@/services/pricing";
import { useApp } from "@/context/AppContext";

function QuickDeliveryMark() {
  return (
    <span className="pointer-events-none absolute left-3 top-0 z-10 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-carrot py-0.5 pl-1.5 pr-2 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm ring-2 ring-white">
      <svg viewBox="0 0 12 12" aria-hidden className="h-3 w-3">
        <path
          d="M6.8.4 2.1 6.7h3.2L4.3 11.6l5.6-7.4H6.6L6.8.4z"
          fill="currentColor"
        />
      </svg>
      Quick delivery
    </span>
  );
}

export function DeliveryPicker({
  shop,
  value,
  onChange,
}: {
  shop: Shop;
  value: DeliveryMode;
  onChange: (mode: DeliveryMode) => void;
}) {
  const { state } = useApp();
  const modes = shopDeliveryModes(shop, state.settings.quickDeliveryEnabled);

  return (
    <div className="grid gap-2 pt-3 sm:grid-cols-2">
      {modes.includes("partner") && (
        <div className="relative">
          <QuickDeliveryMark />
          <button
            type="button"
            onClick={() => onChange("partner")}
            className={`w-full rounded-2xl border p-4 pt-5 text-left transition-colors duration-200 ${
              value === "partner" ? "border-carrot bg-carrot text-white" : "border-border bg-white"
            }`}
          >
            <p className="text-sm font-semibold">Dukkan partner</p>
            <p className={`mt-1 text-xs ${value === "partner" ? "text-white/70" : "text-stone-500"}`}>
              Rider network · typically {state.settings.partnerEtaMinutes} min ·{" "}
              ₹{shop.partnerDeliveryFee} fee
            </p>
          </button>
        </div>
      )}
      {modes.includes("shop") && (
        <button
          type="button"
          onClick={() => onChange("shop")}
          className={`w-full rounded-2xl border p-4 text-left transition-colors duration-200 ${
            value === "shop" ? "border-carrot bg-carrot text-white" : "border-border bg-white"
          }`}
        >
          <p className="text-sm font-semibold">Shop delivery</p>
          <p className={`mt-1 text-xs ${value === "shop" ? "text-white/70" : "text-stone-500"}`}>
            This dukkan sends its own rider · ₹{shop.shopDeliveryFee} fee
          </p>
        </button>
      )}
    </div>
  );
}
