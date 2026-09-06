import type { DeliveryMode, Shop } from "@/lib/types";
import { shopDeliveryModes } from "@/services/pricing";
import { useApp } from "@/context/AppContext";

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
  const modes = shopDeliveryModes(shop);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {modes.includes("partner") && (
        <button
          type="button"
          onClick={() => onChange("partner")}
          className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${
            value === "partner" ? "border-ink bg-ink text-white" : "border-stone-200 bg-white"
          }`}
        >
          <p className="text-sm font-semibold">Dukkan partner</p>
          <p className={`mt-1 text-xs ${value === "partner" ? "text-white/70" : "text-stone-500"}`}>
            Rider network · typically {state.settings.partnerEtaMinutes} min ·{" "}
            ₹{shop.partnerDeliveryFee} fee
          </p>
        </button>
      )}
      {modes.includes("shop") && (
        <button
          type="button"
          onClick={() => onChange("shop")}
          className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${
            value === "shop" ? "border-ink bg-ink text-white" : "border-stone-200 bg-white"
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
