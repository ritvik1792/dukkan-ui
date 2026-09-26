"use client";

import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/format";
import { useMotionRouter } from "@/lib/motion";
import { notificationHref } from "@/lib/notifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M6.2 9.6a5.8 5.8 0 1 1 11.6 0c0 3.2.86 4.5 1.7 5.8.3.46-.04 1.1-.6 1.1H5.1c-.56 0-.9-.64-.6-1.1.84-1.3 1.7-2.6 1.7-5.8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 18.2a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NotificationBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { user, state, dispatch } = useApp();
  const router = useMotionRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; right: number } | null>(null);

  const mine = useMemo(
    () =>
      user
        ? state.notifications
            .filter((item) => item.userId === user.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [state.notifications, user],
  );
  const unread = mine.filter((item) => !item.readAt);
  const unreadCount = unread.length;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelStyle({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  if (!user) return null;

  const buttonClass =
    tone === "dark"
      ? "relative rounded-xl p-2 hover:bg-white/10"
      : "relative rounded-xl p-2 hover:bg-blush";

  function openItem(id: string, href: string) {
    dispatch({ type: "markNotificationsRead", ids: [id] });
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} new notifications` : "Notifications"}
        onClick={() => setOpen((value) => !value)}
        className={buttonClass}
      >
        <BellIcon className="h-5 w-5" />
        <span
          aria-hidden={unreadCount === 0}
          className={`cart-badge absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-semibold text-white ${
            unreadCount === 0 ? "invisible" : ""
          }`}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      </button>
      {open &&
        panelStyle &&
        createPortal(
        <div
          ref={panelRef}
          style={{ top: panelStyle.top, right: panelStyle.right }}
          className="fixed z-[80] w-[min(20.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-white text-ink shadow-xl"
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-stone-500 hover:text-ink"
                onClick={() => dispatch({ type: "markAllNotificationsRead", userId: user.id })}
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {mine.slice(0, 20).map((item) => {
              const href = notificationHref(item, user.role);
              return (
                <li key={item.id} className={item.readAt ? "" : "bg-ember/15"}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left hover:bg-blush/60"
                    onClick={() => openItem(item.id, href)}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{item.message}</p>
                    <p className="mt-1 text-[11px] text-stone-400">{formatDate(item.createdAt)}</p>
                  </button>
                </li>
              );
            })}
            {mine.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-stone-500">No notifications yet.</li>
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
