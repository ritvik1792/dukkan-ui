"use client";

import { useAuthDialog } from "@/components/auth/AuthDialog";
import { useApp } from "@/context/AppContext";
import { categories } from "@/data/seed";
import { isStaffRole, ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useMotionRouter } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.25c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block py-0.5 text-[13px] leading-6 text-stone-800 hover:text-carrot hover:underline"
    >
      {children}
    </Link>
  );
}

export function AccountMenu() {
  const { user, isAuthenticated, logout } = useApp();
  const { openAuth } = useAuthDialog();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number>(0);
  const router = useMotionRouter();

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  const firstName = user?.name.split(" ")[0];
  const close = () => setOpen(false);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-w-[52px] items-center gap-1 rounded-xl px-2 py-1 text-left text-white hover:bg-white/10"
      >
        <AccountIcon className="h-6 w-6 shrink-0 sm:hidden" />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[11px] text-white/85">
            {isAuthenticated && firstName ? `Hello, ${firstName}` : "Hello, sign in"}
          </span>
          <span className="block text-[13px] font-bold">Account &amp; lists</span>
        </span>
        <span className="sr-only sm:hidden">Account menu</span>
      </button>

      {open && !isAuthenticated && (
        <div
          role="menu"
          className="animate-pop-in absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-visible rounded-md bg-white p-4 text-ink shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
        >
          <div className="absolute -top-2 right-6 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white" />
          <button
            type="button"
            onClick={() => {
              close();
              openAuth();
            }}
            className="btn-primary btn-block"
          >
            Sign in
          </button>
        </div>
      )}

      {open && isAuthenticated && user && (
        <div
          role="menu"
          className="animate-pop-in absolute right-0 z-50 mt-2 max-h-[min(80vh,36rem)] w-[min(calc(100vw-1.5rem),34rem)] origin-top-right overflow-y-auto overflow-x-hidden rounded-md bg-white text-ink shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
        >
          <div className="absolute -top-2 right-6 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white" />

          <div className="flex flex-col gap-1 bg-champagne px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="min-w-0 text-[13px] text-ink/80">
              Shopping as <span className="font-semibold text-ink">{user.name}</span>
            </p>
            <Link
              href="/account"
              onClick={close}
              className="shrink-0 text-[13px] font-medium text-carrot hover:underline"
            >
              Manage profile ›
            </Link>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="px-4 py-4 sm:px-5">
              <p className="text-[15px] font-bold">Your shopping</p>
              <div className="mt-2">
                <MenuLink href="/" onClick={close}>
                  Nearby providers
                </MenuLink>
                <MenuLink href="/search" onClick={close}>
                  Search products
                </MenuLink>
                <MenuLink href="/cart" onClick={close}>
                  Cart
                </MenuLink>
                <MenuLink href="/search" onClick={close}>
                  Keep shopping
                </MenuLink>
                {categories.slice(0, 6).map((c) => (
                  <MenuLink key={c.id} href={`/search?category=${c.id}`} onClick={close}>
                    {c.name}
                  </MenuLink>
                ))}
                <MenuLink href="/sell" onClick={close}>
                  Sell on Pink Carrot
                </MenuLink>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="text-[15px] font-bold">Your Account</p>
              <div className="mt-2 flex flex-col items-start">
                <button
                  type="button"
                  className="py-0.5 text-[13px] leading-6 text-stone-800 hover:text-carrot hover:underline"
                  onClick={() => {
                    logout();
                    close();
                    openAuth();
                  }}
                >
                  Switch accounts
                </button>
                <button
                  type="button"
                  className="py-0.5 text-[13px] leading-6 text-stone-800 hover:text-carrot hover:underline"
                  onClick={() => {
                    logout();
                    close();
                    router.push("/");
                  }}
                >
                  Sign out
                </button>
              </div>
              <div className="my-3 border-t border-border" />
                <MenuLink href="/account" onClick={close}>
                  Your Profile
                </MenuLink>
              <MenuLink href="/account/wishlist" onClick={close}>
                Your Wishlist
              </MenuLink>
              <MenuLink href="/account/orders" onClick={close}>
                Your Orders
              </MenuLink>
              <MenuLink href="/account/tickets" onClick={close}>
                Support tickets
              </MenuLink>
              <MenuLink href="/account" onClick={close}>
                Profile, addresses &amp; cards
              </MenuLink>
              <MenuLink href="/search" onClick={close}>
                Keep shopping for
              </MenuLink>
              <MenuLink href="/" onClick={close}>
                Your recommendations
              </MenuLink>
              {user.role === "buyer" && (
                <MenuLink href="/sell" onClick={close}>
                  Sell on Pink Carrot
                </MenuLink>
              )}
              {isStaffRole(user.role) && (
                <MenuLink href={ROUTES.consoleDashboard} onClick={close}>
                  Console
                </MenuLink>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
