"use client";

import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { alertTone, notificationHref, slaNotificationsDue } from "@/lib/notifications";
import { useEffect, useRef } from "react";

export function NotificationWatcher() {
  const { state, user, isAuthenticated, dispatch } = useApp();
  const { showAlert } = useAlert();
  const primedFor = useRef<string | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!state.hydrated) return;
    const key = user?.id ?? "anon";
    if (primedFor.current !== key) {
      primedFor.current = key;
      seen.current = new Set(state.notifications.map((item) => item.id));
      return;
    }
    if (!isAuthenticated || !user) {
      for (const item of state.notifications) seen.current.add(item.id);
      return;
    }
    for (const item of state.notifications) {
      if (seen.current.has(item.id)) continue;
      seen.current.add(item.id);
      if (item.userId !== user.id) continue;
      const href = notificationHref(item, user.role);
      showAlert({
        tone: alertTone(item.kind),
        title: item.title,
        message: item.message,
        action: {
          href,
          label: "Open",
          onClick: () => dispatch({ type: "markNotificationsRead", ids: [item.id] }),
        },
        durationMs: 8000,
      });
    }
  }, [state.hydrated, state.notifications, user, isAuthenticated, showAlert, dispatch]);

  useEffect(() => {
    if (!state.hydrated) return;

    function tick() {
      const due = slaNotificationsDue({
        shops: state.shops,
        orders: state.orders,
        existing: state.notifications,
      });
      for (const item of due) {
        dispatch({ type: "addNotification", notification: item });
      }
    }

    tick();
    const timer = window.setInterval(tick, 20_000);
    return () => window.clearInterval(timer);
  }, [state.hydrated, state.shops, state.orders, state.notifications, dispatch]);

  return null;
}
