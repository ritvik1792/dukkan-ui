"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d={dir === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HorizontalScroller({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync, children]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 320), behavior: "smooth" });
  }

  return (
    <section className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-ink md:text-[22px]">{title}</h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            disabled={!canLeft}
            onClick={() => scrollByDir(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-ink shadow-sm transition duration-200 hover:bg-stone-50 disabled:opacity-30"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            disabled={!canRight}
            onClick={() => scrollByDir(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-ink shadow-sm transition duration-200 hover:bg-stone-50 disabled:opacity-30"
          >
            <Chevron dir="right" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:gap-5"
      >
        {children}
      </div>
    </section>
  );
}
