"use client";

import { useApp } from "@/context/AppContext";
import { CATEGORY_HUES } from "@/lib/constants";
import Link from "next/link";

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
          !activeId ? "bg-ink text-lime" : "hover:bg-stone-100"
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
            activeId === c.id ? "bg-ink text-lime" : "hover:bg-stone-100"
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
          !activeId ? "bg-ink text-white" : "bg-white text-ink hover:bg-stone-100"
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.id}`}
          className={`shrink-0 rounded-full px-4 py-2 text-sm transition duration-200 ${
            activeId === c.id ? "bg-ink text-white" : "bg-white text-ink hover:bg-stone-100"
          }`}
        >
          {c.emoji} {c.name}
        </Link>
      ))}
    </div>
  );
}

export function CategoryCircles() {
  const { state } = useApp();
  const categories = state.categories;
  return (
    <>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.id}`}
          className="flex min-w-[5.75rem] flex-1 snap-start flex-col items-center text-center transition duration-200 hover:-translate-y-0.5"
        >
          <div
            className="flex h-[84px] w-[84px] items-center justify-center rounded-full shadow-inner sm:h-24 sm:w-24"
            style={{
              background: `linear-gradient(160deg, hsl(${CATEGORY_HUES[c.id] ?? 140} 70% 88%), hsl(${CATEGORY_HUES[c.id] ?? 140} 55% 72%))`,
            }}
          >
            <span className="text-3xl leading-none">{c.emoji}</span>
          </div>
          <p className="mt-2 text-[13px] font-semibold leading-tight text-ink">{c.name}</p>
        </Link>
      ))}
    </>
  );
}
