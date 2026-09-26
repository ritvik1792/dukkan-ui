"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

/** On/off switch for enable and disable settings. */
export function Toggle({ checked, onChange, label, hint, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}, ${checked ? "enabled" : "disabled"}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="flex shrink-0 items-center gap-2 disabled:opacity-50"
      >
        <span className={`text-xs font-semibold ${checked ? "text-rose-600" : "text-stone-400"}`}>
          {checked ? "Enabled" : "Disabled"}
        </span>
        <span
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition duration-200 ${
            checked ? "bg-carrot" : "bg-stone-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </span>
      </button>
    </div>
  );
}
