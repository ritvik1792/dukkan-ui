"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AlertTone = "success" | "error" | "info" | "warning";

export type AlertAction = {
  href: string;
  label: string;
};

const toneStyles: Record<AlertTone, string> = {
  success: "border-teal-200 bg-teal-50 text-teal-950",
  error: "border-red-200 bg-red-50 text-red-950",
  info: "border-stone-200 bg-white text-ink",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
};

const toneDot: Record<AlertTone, string> = {
  success: "bg-teal-600",
  error: "bg-red-600",
  info: "bg-ink",
  warning: "bg-amber-500",
};

export function AlertMessage({
  tone = "info",
  title,
  message,
  action,
  onClose,
}: {
  tone?: AlertTone;
  title: string;
  message?: string;
  action?: AlertAction;
  onClose?: () => void;
}) {
  const titleId = useId();

  return (
    <div
      role="status"
      aria-labelledby={titleId}
      className={`flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${toneStyles[tone]}`}
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${toneDot[tone]}`}
      />
      <div className="min-w-0 flex-1">
        <p id={titleId} className="text-sm font-semibold">
          {title}
        </p>
        {message && <p className="mt-0.5 text-sm opacity-80">{message}</p>}
        {action && (
          <Link
            href={action.href}
            className="mt-2 inline-block text-sm font-semibold underline underline-offset-2"
          >
            {action.label}
          </Link>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-1.5 py-0.5 text-sm opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

type Toast = {
  id: number;
  tone: AlertTone;
  title: string;
  message?: string;
  action?: AlertAction;
};

type ShowAlertOptions = {
  tone?: AlertTone;
  title: string;
  message?: string;
  action?: AlertAction;
  durationMs?: number;
};

const AlertContext = createContext<{
  showAlert: (options: ShowAlertOptions) => void;
} | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showAlert = useCallback(
    ({ tone = "info", title, message, action, durationMs = 4200 }: ShowAlertOptions) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, tone, title, message, action }]);
      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
      }
    },
    [dismiss],
  );

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-2">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto animate-[alert-in_200ms_ease-out]">
              <AlertMessage
                tone={toast.tone}
                title={toast.title}
                message={toast.message}
                action={toast.action}
                onClose={() => dismiss(toast.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return ctx;
}
