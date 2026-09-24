"use client";

import { LogoMark } from "@/components/LogoMark";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { BRAND } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { validateEmail } from "@/services/auth";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthDialogContextValue = {
  openAuth: (onSignedIn?: () => void) => void;
  closeAuth: () => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return ctx;
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [onSignedIn, setOnSignedIn] = useState<(() => void) | undefined>();

  const closeAuth = useCallback(() => {
    setOpen(false);
    setOnSignedIn(undefined);
  }, []);

  const openAuth = useCallback((next?: () => void) => {
    setOnSignedIn(() => next);
    setOpen(true);
  }, []);

  return (
    <AuthDialogContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {open && (
        <EmailPasswordAuthDialog
          onClose={closeAuth}
          onSignedIn={() => {
            onSignedIn?.();
            closeAuth();
          }}
        />
      )}
    </AuthDialogContext.Provider>
  );
}

function EmailPasswordAuthDialog({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: () => void;
}) {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cancel = afterPaint(() => setShown(true));
    return cancel;
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const signedIn = await login(email.trim(), password);
      if (!signedIn) {
        setError("Invalid email or password.");
        return;
      }
      onSignedIn();
    } catch {
      setError("Could not reach the API. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-10 sm:items-center sm:pt-0">
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/45 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div className="relative w-full max-w-[22rem]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-12 left-1/2 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white text-lg text-ink shadow-md"
        >
          ×
        </button>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          className={`overflow-hidden rounded-[1.75rem] bg-cream shadow-2xl transition duration-300 ${
            shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="bg-carrot px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white">
            Nearby shops. Fast delivery.
          </p>
          <div className="px-6 pt-5 pb-6">
            <div className="flex justify-center">
              <LogoMark className="h-14 w-14" />
            </div>
            <h2 id="auth-title" className="mt-3 text-center text-[1.35rem] font-bold leading-tight text-ink">
              Sign in to {BRAND.name}
            </h2>
            <p className="mt-1 text-center text-sm text-stone-500">
              Email and password. Phone verification comes later.
            </p>

            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              <label className="block rounded-2xl border border-border bg-white px-3">
                <span className="sr-only">Email</span>
                <input
                  autoFocus
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-transparent py-3 outline-none"
                />
              </label>
              <label className="block rounded-2xl border border-border bg-white px-3">
                <span className="sr-only">Password</span>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent py-3 outline-none"
                />
              </label>
              {error && <p className="text-center text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="btn-primary btn-block btn-lg"
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <div className="flex flex-col gap-1 text-center text-sm text-stone-500">
                <Link href={ROUTES.forgotPassword} onClick={onClose} className="underline">
                  Forgot password?
                </Link>
                <Link href={ROUTES.signup} onClick={onClose} className="underline">
                  Create an account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
