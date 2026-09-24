"use client";

import { fieldClass } from "@/components/ui/Field";
import { useEffect, useMemo, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type ComboProps = {
  options: SelectOption[];
  selected: string[];
  onPick: (value: string) => void;
  onClear: () => void;
  multiple: boolean;
  placeholder: string;
  searchPlaceholder: string;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Label shown on the closed control. Defaults to the selected option labels. */
  display?: string;
};

function matches(option: SelectOption, query: string) {
  if (!query) return true;
  return `${option.label} ${option.hint ?? ""} ${option.value}`.toLowerCase().includes(query);
}

function ComboBox({
  options,
  selected,
  onPick,
  onClear,
  multiple,
  placeholder,
  searchPlaceholder,
  clearLabel,
  disabled,
  className,
  display,
}: ComboProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((option) => matches(option, q));
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const label =
    display ??
    (selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`);

  function choose(option: SelectOption) {
    onPick(option.value);
    if (!multiple) close();
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className={`${fieldClass} flex items-center justify-between gap-2 bg-white text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`truncate ${selectedLabels.length ? "" : "text-stone-400"}`}>{label}</span>
        <span aria-hidden className="shrink-0 text-xs text-stone-400">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
          <div className="border-b border-stone-100 p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:border-ink focus:outline-none"
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((i) => Math.min(i + 1, visible.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const option = visible[active];
                  if (option) choose(option);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  close();
                }
              }}
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm">
            {clearLabel && (
              <li>
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-2 text-left text-stone-500 hover:bg-blush/60"
                  onClick={() => {
                    onClear();
                    if (!multiple) close();
                  }}
                >
                  {clearLabel}
                </button>
              </li>
            )}
            {visible.map((option, index) => {
              const isSelected = selected.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${
                      index === active ? "bg-stone-100" : ""
                    } ${isSelected ? "font-medium" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span className="block truncate text-xs text-stone-400">{option.hint}</span>
                      )}
                    </span>
                    {isSelected && <span className="text-xs text-ink">✓</span>}
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="px-3 py-4 text-center text-stone-400">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Single-choice dropdown that can be typed into. Drop-in replacement for `Select`. */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Type to search",
  clearLabel,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** When set, adds a reset entry at the top of the list that clears the choice. */
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <ComboBox
      multiple={false}
      options={options}
      selected={value ? [value] : []}
      onPick={onChange}
      onClear={() => onChange("")}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      clearLabel={clearLabel}
      disabled={disabled}
      className={className}
    />
  );
}

/** Multi-choice variant used by table filters where several values can be kept at once. */
export function SearchMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Any",
  searchPlaceholder = "Type to search",
  clearLabel = "Clear selection",
  disabled,
  className,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <ComboBox
      multiple
      options={options}
      selected={values}
      onPick={(value) =>
        onChange(
          values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
        )
      }
      onClear={() => onChange([])}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      clearLabel={clearLabel}
      disabled={disabled}
      className={className}
    />
  );
}
