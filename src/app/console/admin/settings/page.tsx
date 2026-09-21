"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";

export default function AdminSettings() {
  const { state, dispatch, switchRole, user } = useApp();
  const s = state.settings;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Platform settings</h1>
      <p className="mt-1 text-sm text-stone-500">
        Radius, partner ETA, and demo role live here — not on the buyer home.
      </p>
      <div className="mt-6 space-y-4">
        <Field label="Discovery radius (km)">
          <TextInput
            type="number"
            min={1}
            value={s.deliveryRadiusKm}
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
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, partnerEtaMinutes: Number(e.target.value) },
              })
            }
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.showDemoRoleSwitcher}
            onChange={(e) =>
              dispatch({
                type: "setSettings",
                settings: { ...s, showDemoRoleSwitcher: e.target.checked },
              })
            }
          />
          Show demo role switcher on Account
        </label>
        <div>
          <p className="text-sm font-medium">Preview as role</p>
          <div className="mt-2 flex gap-2">
            {(["buyer", "seller", "admin"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => switchRole(role)}
                className={`rounded-full px-3 py-1 text-sm capitalize ${
                  user?.role === role ? "bg-ink text-lime" : "bg-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
