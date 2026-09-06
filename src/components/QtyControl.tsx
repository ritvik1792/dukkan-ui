"use client";

import type { MouseEvent } from "react";

type QtyControlSize = "compact" | "wide";

export function QtyControl({
  qty,
  max,
  disabled = false,
  onIncrease,
  onDecrease,
  size = "compact",
  variant = "add",
  addLabel = "ADD",
  decreaseLabel = "Decrease quantity",
  increaseLabel = "Increase quantity",
}: {
  qty: number;
  max: number;
  disabled?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: QtyControlSize;
  variant?: "add" | "stepper";
  addLabel?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
}) {
  const empty = variant === "add" && qty <= 0;
  const canIncrease = !disabled && qty < max;
  const canDecrease = !disabled && qty > 0;
  const compact = size === "compact";

  function stop(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div
      className={
        compact
          ? "qty-control relative h-8 w-24 shrink-0 overflow-hidden rounded-lg border border-teal-700 bg-white"
          : "qty-control relative h-12 w-full overflow-hidden rounded-full border border-teal-700 bg-white"
      }
    >
      <div className={`qty-fill absolute inset-0 bg-teal-700 ${empty ? "" : "is-on"}`} />

      {variant === "add" && (
        <button
          type="button"
          aria-label={addLabel}
          disabled={disabled}
          onClick={(e) => {
            stop(e);
            if (!empty) return;
            onIncrease();
          }}
          className={`qty-layer absolute inset-0 z-20 flex items-center justify-center font-bold uppercase tracking-wide text-teal-700 disabled:opacity-50 ${
            compact ? "text-xs" : "text-sm"
          } ${empty ? "is-visible" : ""}`}
          inert={!empty}
        >
          {addLabel}
        </button>
      )}

      <div
        className={`qty-layer relative z-10 grid h-full grid-cols-3 items-center text-white ${
          empty ? "" : "is-visible"
        }`}
        inert={empty}
      >
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={!canDecrease}
          onClick={(e) => {
            stop(e);
            if (!canDecrease) return;
            onDecrease();
          }}
          className={`flex h-full items-center justify-center font-semibold disabled:opacity-40 ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          −
        </button>
        <span
          key={qty}
          className="qty-tick text-center font-bold tabular-nums"
        >
          {qty > 0 ? qty : ""}
        </span>
        <button
          type="button"
          aria-label={increaseLabel}
          disabled={!canIncrease}
          onClick={(e) => {
            stop(e);
            if (!canIncrease) return;
            onIncrease();
          }}
          className={`flex h-full items-center justify-center font-semibold disabled:opacity-40 ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}
