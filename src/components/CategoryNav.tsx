"use client";

import { useApp } from "@/context/AppContext";
import {
  CATEGORY_GROUPS,
  CATEGORY_HUES,
  POPULAR_CATEGORY_IDS,
} from "@/lib/constants";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

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
}: {
  category: Category;
  index?: number;
}) {
  const hue = CATEGORY_HUES[category.id] ?? 350;
  return (
    <Link
      href={`/search?category=${category.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="category-circle group flex w-[4.75rem] shrink-0 snap-start flex-col items-center text-center sm:w-[5.5rem]"
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
  const [groupId, setGroupId] = useState(CATEGORY_GROUPS[0]?.id ?? "popular");

  const visible = useMemo(() => {
    const group = CATEGORY_GROUPS.find((g) => g.id === groupId) ?? CATEGORY_GROUPS[0];
    const byId = new Map(state.categories.map((c) => [c.id, c]));
    const ids =
      group.categoryIds === "popular"
        ? POPULAR_CATEGORY_IDS
        : group.categoryIds;
    return ids.map((id) => byId.get(id)).filter((c): c is Category => Boolean(c));
  }, [groupId, state.categories]);

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "";
  const title = firstName ? `${firstName}, what's on your mind?` : "What's on your mind?";

  const scrollLeft = () => {
    const el = document.getElementById("category-scroll-container");
    if (el) el.scrollBy({ left: -260, behavior: "smooth" });
  };

  const scrollRight = () => {
    const el = document.getElementById("category-scroll-container");
    if (el) el.scrollBy({ left: 260, behavior: "smooth" });
  };

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
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll left"
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition hover:bg-blush hover:text-rose-700 sm:flex"
          >
            ←
          </button>
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll right"
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition hover:bg-blush hover:text-rose-700 sm:flex"
          >
            →
          </button>
          <Link
            href="/search"
            className="ml-0.5 text-xs font-semibold text-rose-700 underline-offset-2 hover:underline sm:text-sm"
          >
            View all
          </Link>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Category groups"
        className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-0.5"
      >
        {CATEGORY_GROUPS.map((group) => {
          const active = group.id === groupId;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setGroupId(group.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-200 md:text-sm ${
                active ? "chip-active" : "chip-idle text-ink/80"
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      <div
        id="category-scroll-container"
        key={groupId}
        className="no-scrollbar -mx-0.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-0.5 sm:gap-3.5"
      >
        {visible.map((c, i) => (
          <CategoryCircleLink key={c.id} category={c} index={i} />
        ))}
        {visible.length === 0 && (
          <p className="py-3 text-sm text-muted">No categories in this group yet.</p>
        )}
      </div>
    </section>
  );
}
