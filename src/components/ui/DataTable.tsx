"use client";

import { SearchMultiSelect, type SelectOption } from "@/components/ui/SearchSelect";
import { TextInput } from "@/components/ui/Field";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

export type ColumnFilter =
  | { kind: "select"; options?: SelectOption[]; placeholder?: string }
  | { kind: "text"; placeholder?: string }
  | { kind: "range"; step?: number; minPlaceholder?: string; maxPlaceholder?: string };

export type Column<T> = {
  id: string;
  header: string;
  /**
   * The sortable / filterable / searchable value behind the cell. `render` only decorates it, so
   * a column stays usable in every control even when the cell shows badges or buttons.
   */
  value: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  filter?: ColumnFilter;
  align?: "left" | "right" | "center";
  defaultHidden?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

type SortState = { columnId: string; dir: "asc" | "desc" } | null;
type FilterState = Record<string, string[] | string | { min: string; max: string }>;

const PAGE_SIZES = [10, 25, 50, 100];

function textOf(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function compare(a: string | number | null | undefined, b: string | number | null | undefined) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return textOf(a).localeCompare(textOf(b), undefined, { numeric: true, sensitivity: "base" });
}

function isActiveFilter(value: FilterState[string]) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value.min.trim().length > 0 || value.max.trim().length > 0;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  searchPlaceholder = "Search",
  searchText,
  emptyMessage = "Nothing matches these filters.",
  initialSort,
  actions,
  pageSize: initialPageSize = 25,
  dense = false,
  selectable,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  /** Extra text folded into the global search, for fields with no column of their own. */
  searchText?: (row: T) => string;
  emptyMessage?: string;
  initialSort?: { columnId: string; dir: "asc" | "desc" };
  actions?: ReactNode;
  pageSize?: number;
  dense?: boolean;
  selectable?: {
    selected: string[];
    onChange: (selected: string[]) => void;
  };
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(initialSort ?? null);
  const [filters, setFilters] = useState<FilterState>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [hidden, setHidden] = useState<string[]>(() =>
    columns.filter((column) => column.defaultHidden).map((column) => column.id),
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const columnsMenuRef = useRef<HTMLDivElement>(null);
  const selectHeaderRef = useRef<HTMLInputElement>(null);

  const filterable = useMemo(() => columns.filter((column) => column.filter), [columns]);
  const visibleColumns = useMemo(
    () => columns.filter((column) => !hidden.includes(column.id)),
    [columns, hidden],
  );

  useEffect(() => {
    if (!columnsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!columnsMenuRef.current?.contains(event.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [columnsOpen]);

  const optionsByColumn = useMemo(() => {
    const map: Record<string, SelectOption[]> = {};
    for (const column of filterable) {
      if (column.filter?.kind !== "select") continue;
      if (column.filter.options) {
        map[column.id] = column.filter.options;
        continue;
      }
      const seen = new Set<string>();
      for (const row of rows) {
        const label = textOf(column.value(row));
        if (label) seen.add(label);
      }
      map[column.id] = [...seen]
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ value: label, label }));
    }
    return map;
  }, [filterable, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      for (const column of filterable) {
        const state = filters[column.id];
        if (!state || !isActiveFilter(state)) continue;
        const raw = column.value(row);
        if (Array.isArray(state)) {
          if (!state.includes(textOf(raw))) return false;
        } else if (typeof state === "string") {
          if (!textOf(raw).toLowerCase().includes(state.trim().toLowerCase())) return false;
        } else {
          const numeric = typeof raw === "number" ? raw : Number(raw);
          if (Number.isNaN(numeric)) return false;
          if (state.min.trim() && numeric < Number(state.min)) return false;
          if (state.max.trim() && numeric > Number(state.max)) return false;
        }
      }
      if (!q) return true;
      const haystack = columns
        .filter((column) => column.searchable !== false)
        .map((column) => textOf(column.value(row)))
        .concat(searchText ? searchText(row) : "")
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, columns, filterable, filters, search, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((item) => item.id === sort.columnId);
    if (!column) return filtered;
    const direction = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compare(column.value(a), column.value(b)) * direction);
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const filteredKeys = useMemo(() => filtered.map(rowKey), [filtered, rowKey]);
  const selectedSet = useMemo(
    () => new Set(selectable?.selected ?? []),
    [selectable?.selected],
  );
  const allFilteredSelected =
    Boolean(selectable) &&
    filteredKeys.length > 0 &&
    filteredKeys.every((key) => selectedSet.has(key));
  const someFilteredSelected =
    Boolean(selectable) && filteredKeys.some((key) => selectedSet.has(key));

  useEffect(() => {
    if (!selectHeaderRef.current) return;
    selectHeaderRef.current.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [someFilteredSelected, allFilteredSelected]);

  const activeFilterCount = filterable.filter((column) => {
    const state = filters[column.id];
    return state ? isActiveFilter(state) : false;
  }).length;

  function toggleSort(column: Column<T>) {
    if (column.sortable === false) return;
    setSort((current) => {
      if (!current || current.columnId !== column.id) return { columnId: column.id, dir: "asc" };
      if (current.dir === "asc") return { columnId: column.id, dir: "desc" };
      return null;
    });
  }

  /** Narrowing the rows can leave the reader stranded on an empty page, so start over. */
  function setFilter(columnId: string, value: FilterState[string]) {
    setFilters((current) => ({ ...current, [columnId]: value }));
    setPage(0);
  }

  const cellPad = dense ? "px-3 py-2" : "px-4 py-3";
  const colCount = visibleColumns.length + (selectable ? 1 : 0);

  function toggleSelectFiltered() {
    if (!selectable) return;
    if (allFilteredSelected) {
      const drop = new Set(filteredKeys);
      selectable.onChange(selectable.selected.filter((key) => !drop.has(key)));
      return;
    }
    selectable.onChange([...new Set([...selectable.selected, ...filteredKeys])]);
  }

  function toggleSelectRow(key: string) {
    if (!selectable) return;
    selectable.onChange(
      selectedSet.has(key)
        ? selectable.selected.filter((id) => id !== key)
        : [...selectable.selected, key],
    );
  }

  function handleRowClick(row: T, event: ReactMouseEvent<HTMLTableRowElement>) {
    if (!onRowClick) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, label")) return;
    onRowClick(row);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[12rem] flex-1">
          <TextInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
        {filterable.length > 0 && (
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeFilterCount ? "border-ink bg-ink text-lime" : "border-stone-200 bg-white"
            }`}
          >
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
        )}
        <div className="relative" ref={columnsMenuRef}>
          <button
            type="button"
            onClick={() => setColumnsOpen((v) => !v)}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm"
          >
            Columns
          </button>
          {columnsOpen && (
            <div className="absolute right-0 z-40 mt-1 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-xl">
              {columns.map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={!hidden.includes(column.id)}
                    onChange={(event) =>
                      setHidden((current) =>
                        event.target.checked
                          ? current.filter((id) => id !== column.id)
                          : [...current, column.id],
                      )
                    }
                  />
                  {column.header}
                </label>
              ))}
            </div>
          )}
        </div>
        {actions}
      </div>

      {filtersOpen && filterable.length > 0 && (
        <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filterable.map((column) => {
              const filter = column.filter!;
              const state = filters[column.id];
              return (
                <label key={column.id} className="block text-sm font-medium">
                  {column.header}
                  <div className="mt-1 font-normal">
                    {filter.kind === "select" && (
                      <SearchMultiSelect
                        values={Array.isArray(state) ? state : []}
                        onChange={(values) => setFilter(column.id, values)}
                        options={optionsByColumn[column.id] ?? []}
                        placeholder={filter.placeholder ?? `All ${column.header.toLowerCase()}`}
                      />
                    )}
                    {filter.kind === "text" && (
                      <TextInput
                        value={typeof state === "string" ? state : ""}
                        onChange={(event) => setFilter(column.id, event.target.value)}
                        placeholder={filter.placeholder ?? `Contains…`}
                      />
                    )}
                    {filter.kind === "range" && (
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          step={filter.step}
                          value={
                            state && !Array.isArray(state) && typeof state !== "string"
                              ? state.min
                              : ""
                          }
                          onChange={(event) =>
                            setFilter(column.id, {
                              min: event.target.value,
                              max:
                                state && !Array.isArray(state) && typeof state !== "string"
                                  ? state.max
                                  : "",
                            })
                          }
                          placeholder={filter.minPlaceholder ?? "Min"}
                        />
                        <span className="text-stone-400">–</span>
                        <TextInput
                          type="number"
                          step={filter.step}
                          value={
                            state && !Array.isArray(state) && typeof state !== "string"
                              ? state.max
                              : ""
                          }
                          onChange={(event) =>
                            setFilter(column.id, {
                              min:
                                state && !Array.isArray(state) && typeof state !== "string"
                                  ? state.min
                                  : "",
                              max: event.target.value,
                            })
                          }
                          placeholder={filter.maxPlaceholder ?? "Max"}
                        />
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end gap-3 text-xs">
            <button
              type="button"
              className="underline"
              onClick={() => {
                setFilters({});
                setPage(0);
              }}
            >
              Reset filters
            </button>
            <button type="button" className="underline" onClick={() => setFiltersOpen(false)}>
              Hide
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              {selectable && (
                <th className={`${cellPad} w-10`}>
                  <input
                    ref={selectHeaderRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectFiltered}
                    aria-label="Select all visible rows"
                  />
                </th>
              )}
              {visibleColumns.map((column) => {
                const activeSort = sort?.columnId === column.id ? sort : null;
                const alignment =
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left";
                return (
                  <th
                    key={column.id}
                    className={`${cellPad} ${alignment} ${column.headerClassName ?? ""}`}
                  >
                    {column.sortable === false ? (
                      column.header
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className="inline-flex items-center gap-1 uppercase hover:text-ink"
                      >
                        {column.header}
                        <span className={activeSort ? "text-ink" : "text-stone-300"}>
                          {activeSort ? (activeSort.dir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? (event) => handleRowClick(row, event) : undefined}
                className={`border-b last:border-0 ${
                  onRowClick ? "cursor-pointer transition-colors duration-150 hover:bg-stone-50" : ""
                }`}
              >
                {selectable && (
                  <td className={`${cellPad} w-10`}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(rowKey(row))}
                      onChange={() => toggleSelectRow(rowKey(row))}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {visibleColumns.map((column) => {
                  const alignment =
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left";
                  return (
                    <td
                      key={column.id}
                      className={`${cellPad} ${alignment} ${column.cellClassName ?? ""}`}
                    >
                      {column.render ? column.render(row) : textOf(column.value(row))}
                    </td>
                  );
                })}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(colCount, 1)}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <p>
          {sorted.length === 0
            ? "No rows"
            : `Showing ${start + 1}–${Math.min(start + pageSize, sorted.length)} of ${sorted.length}`}
          {sorted.length !== rows.length ? ` (filtered from ${rows.length})` : ""}
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            Rows
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="rounded-lg border border-stone-200 px-2 py-1"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-full border border-stone-200 px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-full border border-stone-200 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
