"use client";

import { useApp } from "@/context/AppContext";
import { CATEGORY_HUES, POPULAR_CATEGORY_IDS } from "@/lib/constants";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { useMemo } from "react";

export function CategoryList({
  activeId,
  onSelect,
}: {
  activeId?: string;
  onSelect?: () => void;
}) {
  const { state } = useApp();
  const categories = state.categories;
  return (
    <nav className="space-y-1">
      <Link
        href="/search"
        onClick={onSelect}
        className={`block rounded-xl px-3 py-2 text-sm transition duration-200 ${
          !activeId ? "bg-carrot text-white" : "hover:bg-blush"
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.id}`}
          onClick={onSelect}
          className={`block rounded-xl px-3 py-2 text-sm transition duration-200 ${
            activeId === c.id ? "bg-carrot text-white" : "hover:bg-blush"
          }`}
        >
          {c.emoji} {c.name}
        </Link>
      ))}
    </nav>
  );
}

export function CategoryChips({
  activeId,
}: {
  activeId?: string;
}) {
  const { state } = useApp();
  const categories = state.categories;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link
        href="/"
        className={`shrink-0 rounded-full px-4 py-2 text-sm transition duration-200 ${
          !activeId ? "chip-active" : "chip-idle"
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.id}`}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition duration-200 ${
            activeId === c.id ? "chip-active" : "chip-idle"
          }`}
        >
          {c.emoji} {c.name}
        </Link>
      ))}
    </div>
  );
}

function CategoryCircleLink({
  category,
  index = 0,
  fill = false,
}: {
  category: Category;
  index?: number;
  fill?: boolean;
}) {
  const hue = CATEGORY_HUES[category.id] ?? 350;
  return (
    <Link
      href={`/search?category=${category.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={`category-circle group flex flex-col items-center text-center ${
        fill ? "w-full min-w-0" : "w-[4.75rem] shrink-0 snap-start sm:w-[5.5rem]"
      }`}
    >
      <div
        className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/80 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-md group-hover:ring-rose-200 sm:h-[4.75rem] sm:w-[4.75rem]"
        style={{
          background: `linear-gradient(145deg, #ffffff 30%, hsl(${hue} 45% 95%) 100%)`,
        }}
      >
        <span className="text-[1.65rem] leading-none transition-transform duration-200 group-hover:scale-110 sm:text-[1.85rem]">
          {category.emoji}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold tracking-tight text-ink transition-colors group-hover:text-rose-700 sm:text-xs">
        {category.name}
      </p>
    </Link>
  );
}

/** Flat circle row (e.g. if a parent already provides a scroller). */
export function CategoryCircles({ categories }: { categories?: Category[] }) {
  const { state } = useApp();
  const list = categories ?? state.categories;
  return (
    <>
      {list.map((c, i) => (
        <CategoryCircleLink key={c.id} category={c} index={i} />
      ))}
    </>
  );
}

/**
 * Home browse: "What's on your mind?" clean category scroller
 * Keeps cognitive load low while every category stays one tap away.
 */
export function CategoryBrowse() {
  const { state, user } = useApp();

  const visible = useMemo(() => {
    const byId = new Map(state.categories.map((c) => [c.id, c]));
    const picked = POPULAR_CATEGORY_IDS.map((id) => byId.get(id)).filter(
      (c): c is Category => Boolean(c),
    );
    const pickedIds = new Set(picked.map((c) => c.id));
    const rest = state.categories.filter((c) => !pickedIds.has(c.id));
    return [...picked, ...rest];
  }, [state.categories]);

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "";
  const title = firstName ? `${firstName}, what's on your mind?` : "What's on your mind?";

  return (
    <section className="animate-fade-up">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Explore fresh foods, daily essentials &amp; local picks
          </p>
        </div>
        <Link
          href="/search"
          className="shrink-0 text-xs font-semibold text-rose-700 underline-offset-2 hover:underline sm:text-sm"
        >
          View all
        </Link>
      </div>

      <div className="no-scrollbar flex w-full flex-nowrap gap-x-3 overflow-x-auto pb-1 sm:gap-x-4">
        {visible.map((c, i) => (
          <CategoryCircleLink key={c.id} category={c} index={i} />
        ))}
        {visible.length === 0 && (
          <p className="py-3 text-sm text-muted">No categories yet.</p>
        )}
      </div>
    </section>
  );
}
