"use client";

import { ShopDetailSheet } from "@/components/shops/ShopDetailSheet";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

const ShopPeekContext = createContext<{ openShop: (shopId: string) => void } | null>(null);

export function useShopPeek() {
  return useContext(ShopPeekContext);
}

export function ShopPeekProvider({ children }: { children: ReactNode }) {
  const { shopById } = useApp();
  const [shopId, setShopId] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    setShown(false);
    return afterPaint(() => setShown(true));
  }, [shopId]);

  const openShop = useCallback((id: string) => {
    setShopId(id);
  }, []);

  function close() {
    setShown(false);
    window.setTimeout(() => setShopId(null), 320);
  }

  const shop = shopId ? shopById(shopId) : undefined;

  return (
    <ShopPeekContext.Provider value={{ openShop }}>
      {children}
      {shop && <ShopDetailSheet shop={shop} shown={shown} onClose={close} />}
    </ShopPeekContext.Provider>
  );
}

export function ShopNameButton({
  shopId,
  children,
  className = "text-left underline decoration-stone-300 hover:decoration-ink",
}: {
  shopId?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const peek = useShopPeek();
  const empty = typeof children === "string" && (!children.trim() || children === "—");
  if (!shopId || !peek || empty) {
    return <span>{children}</span>;
  }

  const openShop = peek.openShop;
  const id = shopId;

  function open(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    openShop(id);
  }

  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}
