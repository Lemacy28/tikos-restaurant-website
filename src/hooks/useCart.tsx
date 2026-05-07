import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type CartLine = { id: string; name: string; price: number; qty: number; image_url?: string | null };
type CartMap = Record<string, CartLine>;

type CartCtx = {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "tikos_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartMap>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const add: CartCtx["add"] = (line) =>
    setCart((c) => ({ ...c, [line.id]: { ...line, qty: (c[line.id]?.qty ?? 0) + 1 } }));

  const dec = (id: string) =>
    setCart((c) => {
      const it = c[id];
      if (!it) return c;
      if (it.qty <= 1) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...it, qty: it.qty - 1 } };
    });

  const remove = (id: string) =>
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });

  const clear = () => setCart({});

  const items = useMemo(() => Object.values(cart), [cart]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  return <Ctx.Provider value={{ items, count, subtotal, add, dec, remove, clear }}>{children}</Ctx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
