"use client";

import { useApp } from "@/context/AppContext";
import { fetchSearch } from "@/lib/api";
import { useMotionRouter } from "@/lib/motion";
import { ROUTES } from "@/lib/routes";
import type { SearchResults } from "@/lib/types";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 8;

export type SearchSuggestVariant = "header" | "hero";

type Suggestion = {
  key: string;
  kind: "product" | "shop" | "service" | "person";
  label: string;
  sublabel?: string;
  href: string;
  productId?: string;
  shopId?: string;
};

const KIND_LABEL: Record<Suggestion["kind"], string> = {
  product: "Product",
  shop: "Shop",
  service: "Service",
  person: "People",
};

function highlightMatch(text: string, query: string) {
  const needle = query.trim();
  if (!needle) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(needle.toLowerCase());
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + needle.length);
  const after = text.slice(idx + needle.length);
  return (
    <>
      {before}
      <mark className="rounded-sm bg-carrot/25 font-semibold text-inherit">{match}</mark>
      {after}
    </>
  );
}

function localSuggestions(
  query: string,
  catalog: { id: string; name: string; brand: string }[],
  shops: {
    id: string;
    name: string;
    description: string;
    providerType?: string;
    profession?: string;
  }[],
): Suggestion[] {
  const needle = query.toLowerCase();
  const out: Suggestion[] = [];

  for (const p of catalog) {
    if (!`${p.name} ${p.brand}`.toLowerCase().includes(needle)) continue;
    out.push({
      key: `product-${p.id}`,
      kind: "product",
      label: p.name,
      sublabel: p.brand,
      href: `/product/${p.id}`,
      productId: p.id,
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }

  for (const s of shops) {
    if (!`${s.name} ${s.description}`.toLowerCase().includes(needle)) continue;
    const isPerson = s.providerType === "INDIVIDUAL";
    out.push({
      key: `${isPerson ? "person" : "shop"}-${s.id}`,
      kind: isPerson ? "person" : "shop",
      label: s.name,
      sublabel: isPerson ? s.profession || "Provider" : "Shop",
      href: ROUTES.shopDashboard,
      shopId: s.id,
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }

  return out;
}

function fromRemote(remote: SearchResults): Suggestion[] {
  const out: Suggestion[] = [];

  for (const p of remote.products) {
    out.push({
      key: `product-${p.id}`,
      kind: "product",
      label: p.name,
      sublabel: p.brand,
      href: `/product/${p.id}`,
      productId: p.id,
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }
  for (const s of remote.shops) {
    out.push({
      key: `shop-${s.id}`,
      kind: "shop",
      label: s.name,
      sublabel: "Shop",
      href: ROUTES.shopDashboard,
      shopId: s.id,
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }
  for (const s of remote.services) {
    const href = s.bookingEnabled
      ? `/services/book?serviceId=${encodeURIComponent(s.id)}`
      : `/services/request?serviceId=${encodeURIComponent(s.id)}`;
    out.push({
      key: `service-${s.id}`,
      kind: "service",
      label: s.name,
      sublabel: s.providerName,
      href,
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }
  for (const p of remote.people) {
    out.push({
      key: `person-${p.id}`,
      kind: "person",
      label: p.name,
      sublabel: p.profession || "Provider",
      href: ROUTES.shopDashboard,
      shopId: p.id,
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }
  return out;
}

export function SearchSuggest({
  variant = "header",
  placeholder = "Search for products, shops, services or people...",
  autoFocus = false,
  showSubmit = false,
  className = "",
  onNavigated,
}: {
  variant?: SearchSuggestVariant;
  placeholder?: string;
  autoFocus?: boolean;
  showSubmit?: boolean;
  className?: string;
  onNavigated?: () => void;
}) {
  const { state, origin, selectProduct, selectShop } = useApp();
  const router = useMotionRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      setActive(-1);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      const fallback = localSuggestions(q, state.catalog, state.shops);

      fetchSearch({ q, lat: origin.lat, lng: origin.lng })
        .then((remote) => {
          if (cancelled) return;
          const remoteItems = fromRemote(remote);
          setItems(remoteItems.length ? remoteItems : fallback);
          setOpen(true);
          setActive(-1);
        })
        .catch(() => {
          if (cancelled) return;
          setItems(fallback);
          setOpen(fallback.length > 0);
          setActive(-1);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, origin.lat, origin.lng, state.catalog, state.shops]);

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function goSearch(q: string) {
    const trimmed = q.trim();
    setOpen(false);
    onNavigated?.();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function goSuggestion(item: Suggestion) {
    if (item.productId) selectProduct(item.productId);
    if (item.shopId) selectShop(item.shopId);
    setOpen(false);
    setQuery("");
    onNavigated?.();
    router.push(item.href);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (active >= 0 && items[active]) {
      goSuggestion(items[active]);
      return;
    }
    goSearch(query);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  const inputClass =
    variant === "header"
      ? "w-full rounded-xl border border-white/10 bg-ink/80 px-4 py-2.5 text-sm text-white placeholder:text-white/45 outline-none focus:ring-2 focus:ring-carrot/50"
      : "w-full flex-1 rounded-2xl border border-white/15 bg-white px-4 py-3 text-base text-ink outline-none ring-carrot/40 placeholder:text-ink/40 focus:ring-2";

  const showDropdown = open && query.trim().length > 0 && (items.length > 0 || loading);

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <form onSubmit={onSubmit} className="w-full">
        <div className={showSubmit ? "flex w-full flex-col gap-2 sm:flex-row sm:items-stretch" : "w-full"}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim() && items.length) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={inputClass}
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
          />
          {showSubmit && (
            <button
              type="submit"
              className="btn-primary btn-lg sm:shrink-0 rounded-2xl"
            >
              Search
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-white py-1 text-ink shadow-xl animate-pop-in"
        >
          {loading && items.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-stone-500">Searching…</li>
          )}
          {items.map((item, index) => (
            <li key={item.key} role="option" aria-selected={index === active} id={`${listId}-${index}`}>
              <button
                type="button"
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm ${
                  index === active ? "bg-blush/80" : "hover:bg-blush/60"
                }`}
                onMouseEnter={() => setActive(index)}
                onClick={() => goSuggestion(item)}
              >
                <span className="mt-0.5 w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-carrot">
                  {KIND_LABEL[item.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{highlightMatch(item.label, query)}</span>
                  {item.sublabel && (
                    <span className="mt-0.5 block truncate text-xs text-stone-500">{item.sublabel}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
