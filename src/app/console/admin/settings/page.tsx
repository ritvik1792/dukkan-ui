"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/context/AppContext";
import { patchSettingsRequest } from "@/lib/api";
import type { PlatformSettings } from "@/lib/types";

export default function AdminSettings() {
  const { state, dispatch } = useApp();
  const s = state.settings;

  function persist(next: PlatformSettings) {
    dispatch({ type: "setSettings", settings: next });
    void patchSettingsRequest({
      deliveryRadiusKm: next.deliveryRadiusKm,
      partnerEtaMinutes: next.partnerEtaMinutes,
      showDemoRoleSwitcher: next.showDemoRoleSwitcher,
      requestResponseWindowSeconds: next.requestResponseWindowSeconds,
      requestWaveSize: next.requestWaveSize,
      requestMaxShops: next.requestMaxShops,
      offerExpirySeconds: next.offerExpirySeconds,
      requestMaxWaves: next.requestMaxWaves,
      quickDeliveryEnabled: next.quickDeliveryEnabled,
    }).catch(() => undefined);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Platform settings</h1>
      <p className="mt-1 text-sm text-stone-500">
        Radius, partner ETA, availability request waves, and demo role live here.
      </p>
      <div className="mt-6 space-y-4">
        <Toggle
          label="Quick delivery"
          hint="Off until you turn it on. Dukkan does not offer partner quick delivery yet."
          checked={Boolean(s.quickDeliveryEnabled)}
          onChange={(checked) => persist({ ...s, quickDeliveryEnabled: checked })}
        />
        <Field label="Discovery radius (km)">
          <TextInput
            type="number"
            min={1}
            value={s.deliveryRadiusKm}
            onBlur={(e) => persist({ ...s, deliveryRadiusKm: Number(e.target.value) })}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, deliveryRadiusKm: Number(e.target.value) },
              })
            }
          />
        </Field>
        <Field label="Partner ETA (minutes)">
          <TextInput
            type="number"
            min={1}
            value={s.partnerEtaMinutes}
            onBlur={(e) => persist({ ...s, partnerEtaMinutes: Number(e.target.value) })}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, partnerEtaMinutes: Number(e.target.value) },
              })
            }
          />
        </Field>

        <h2 className="pt-2 text-sm font-semibold">Availability requests</h2>
        <Field label="Response window (seconds)">
          <TextInput
            type="number"
            min={30}
            value={s.requestResponseWindowSeconds ?? 120}
            onBlur={(e) =>
              persist({ ...s, requestResponseWindowSeconds: Number(e.target.value) })
            }
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, requestResponseWindowSeconds: Number(e.target.value) },
              })
            }
          />
        </Field>
        <Field label="Wave size (shops per wave)">
          <TextInput
            type="number"
            min={1}
            value={s.requestWaveSize ?? 5}
            onBlur={(e) => persist({ ...s, requestWaveSize: Number(e.target.value) })}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, requestWaveSize: Number(e.target.value) },
              })
            }
          />
        </Field>
        <Field label="Max shops per request">
          <TextInput
            type="number"
            min={1}
            value={s.requestMaxShops ?? 20}
            onBlur={(e) => persist({ ...s, requestMaxShops: Number(e.target.value) })}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, requestMaxShops: Number(e.target.value) },
              })
            }
          />
        </Field>
        <Field label="Max waves">
          <TextInput
            type="number"
            min={1}
            value={s.requestMaxWaves ?? 3}
            onBlur={(e) => persist({ ...s, requestMaxWaves: Number(e.target.value) })}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, requestMaxWaves: Number(e.target.value) },
              })
            }
          />
        </Field>
        <Field label="Offer expiry (seconds)">
          <TextInput
            type="number"
            min={60}
            value={s.offerExpirySeconds ?? 900}
            onBlur={(e) => persist({ ...s, offerExpirySeconds: Number(e.target.value) })}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, offerExpirySeconds: Number(e.target.value) },
              })
            }
          />
        </Field>

        <p className="text-sm text-stone-600">
          Each person has one role. There can be many buyers, many sellers, and many admins.
          A new signup does not replace or delete an existing account. Admin can use the shop
          and the whole console. Sellers can use the shop and the seller console. Buyers stay
          on the shop.
        </p>
      </div>
    </div>
  );
}
