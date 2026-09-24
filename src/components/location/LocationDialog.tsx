"use client";

import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { geoErrorMessage, readGeoPermission, type GeoPermission } from "@/lib/geolocation";
import { locationSummary } from "@/services/location";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** Buyer surfaces where a missing location actually changes what is on screen. */
const PROMPT_ROUTES = new Set(["/", "/search"]);

type LocationDialogContextValue = {
  openLocation: () => void;
  closeLocation: () => void;
};

const LocationDialogContext = createContext<LocationDialogContextValue | null>(null);

export function useLocationDialog() {
  const ctx = useContext(LocationDialogContext);
  if (!ctx) throw new Error("useLocationDialog must be used within LocationDialogProvider");
  return ctx;
}

export function LocationDialogProvider({ children }: { children: ReactNode }) {
  const { needsLocationPrompt, dismissLocationPrompt } = useApp();
  const pathname = usePathname();
  const [manualOpen, setManualOpen] = useState(false);

  // Derived rather than an effect: choosing or dismissing a location clears
  // `needsLocationPrompt`, which closes the first-run popup on its own.
  const firstRun = needsLocationPrompt && PROMPT_ROUTES.has(pathname);
  const open = manualOpen || firstRun;

  const openLocation = useCallback(() => setManualOpen(true), []);
  const closeLocation = useCallback(() => {
    setManualOpen(false);
    dismissLocationPrompt();
  }, [dismissLocationPrompt]);

  return (
    <LocationDialogContext.Provider value={{ openLocation, closeLocation }}>
      {children}
      {open && <LocationDialog onClose={closeLocation} firstRun={firstRun} />}
    </LocationDialogContext.Provider>
  );
}

function LocationDialog({
  onClose,
  firstRun,
}: {
  onClose: () => void;
  firstRun: boolean;
}) {
  const { location, shopRadiusKm, detectLocation, setAreaLocation, state } = useApp();
  const neighborhoods = state.neighborhoods;
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState<GeoPermission>("prompt");

  useEffect(() => {
    const cancel = afterPaint(() => setShown(true));
    return cancel;
  }, []);

  useEffect(() => {
    let cancelled = false;
    readGeoPermission().then((next) => {
      if (!cancelled) setPermission(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function captureGps() {
    setBusy(true);
    setError("");
    try {
      await detectLocation();
      onClose();
    } catch (err) {
      setError(geoErrorMessage(err));
      setPermission(await readGeoPermission());
    } finally {
      setBusy(false);
    }
  }

  function pickArea(id: string) {
    setAreaLocation(id);
    onClose();
  }

  const blocked = permission === "denied" || permission === "unsupported";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-10 sm:items-center sm:pt-0">
      <button
        type="button"
        aria-label="Close location picker"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/45 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div className="relative w-full max-w-[24rem]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-12 left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white text-lg text-ink shadow-md"
        >
          ×
        </button>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-title"
          className={`overflow-hidden rounded-[1.75rem] bg-cream shadow-2xl transition duration-300 ${
            shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="bg-carrot px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white">
            Nearby shops. Fast delivery.
          </p>
          <div className="max-h-[70vh] overflow-y-auto px-6 pt-5 pb-6">
            <div className="flex justify-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-carrot text-white">
                <PinIcon />
              </span>
            </div>
            <h2
              id="location-title"
              className="mt-3 text-center text-[1.35rem] font-bold leading-tight text-ink"
            >
              {firstRun ? "Where are you shopping from?" : "Change your location"}
            </h2>
            <p className="mt-1 text-center text-sm text-stone-500">
              We use it to show dukkans within {shopRadiusKm} km and to set your default
              delivery area.
            </p>

            {location && (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-xs text-stone-500">
                Currently: <span className="font-medium text-ink">{locationSummary(location)}</span>
              </p>
            )}

            {!blocked && (
              <button
                type="button"
                onClick={captureGps}
                disabled={busy}
                className="btn-primary btn-block btn-lg mt-5"
              >
                <PinIcon className="h-4 w-4" />
                {busy ? "Getting your location…" : "Use my current location"}
              </button>
            )}

            {error && <p className="mt-3 text-center text-sm text-red-700">{error}</p>}
            {blocked && !error && (
              <p className="mt-4 text-center text-sm text-red-700">
                {permission === "unsupported"
                  ? "This browser can't share a location."
                  : "Location access is blocked for this site. Enable it from the address bar to use GPS."}
              </p>
            )}

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-stone-400">
              <span className="h-px flex-1 bg-stone-300" />
              or pick an area
              <span className="h-px flex-1 bg-stone-300" />
            </div>

            <ul className="space-y-2">
              {neighborhoods.map((item) => {
                const active =
                  location?.source === "area" && location.label === item.name;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => pickArea(item.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
                        active
                          ? "border-carrot/40 bg-blush"
                          : "border-border bg-white hover:border-carrot/30"
                      }`}
                    >
                      <span>
                        <span className="font-medium text-ink">{item.name}</span>
                        <span className="block text-xs text-stone-500">{item.area}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full text-sm text-stone-500 underline"
            >
              {firstRun ? "Not now" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PinIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
