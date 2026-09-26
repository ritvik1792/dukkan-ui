"use client";

import type { Category } from "@/lib/types";

export function CategoryMultiSelect({
  categories,
  selectedIds,
  onChange,
  emptyLabel = "No categories yet.",
}: {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel?: string;
}) {
  if (categories.length === 0) {
    return <p className="text-sm text-stone-500">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const selected = selectedIds.includes(category.id);
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(
                selected
                  ? selectedIds.filter((id) => id !== category.id)
                  : [...selectedIds, category.id],
              )
            }
            className={`rounded-full px-3 py-1.5 text-sm transition duration-200 ${
              selected ? "chip-active" : "chip-idle"
            }`}
          >
            {category.emoji} {category.name}
          </button>
        );
      })}
    </div>
  );
}

export function isProductCategory(category: Category) {
  return !category.kind || category.kind === "PRODUCT" || category.kind === "BOTH";
}

export function isServiceCategory(category: Category) {
  return !category.kind || category.kind === "SERVICE" || category.kind === "BOTH";
}
