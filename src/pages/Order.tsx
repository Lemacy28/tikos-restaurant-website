import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { menu } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import CheckoutDialog from "@/components/CheckoutDialog";

type Cart = Record<string, { name: string; price: number; qty: number }>;

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const Order = () => {
  const [cart, setCart] = useState<Cart>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const add = (name: string, price: number) =>
    setCart((c) => ({ ...c, [name]: { name, price, qty: (c[name]?.qty ?? 0) + 1 } }));
  const dec = (name: string) =>
    setCart((c) => {
      const item = c[name];
      if (!item) return c;
      if (item.qty <= 1) {
        const { [name]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [name]: { ...item, qty: item.qty - 1 } };
    });
  const remove = (name: string) => setCart((c) => { const { [name]: _, ...rest } = c; return rest; });

  const items = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Order Online</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Build your order</h1>
          <p className="mt-3 max-w-xl mx-auto text-primary-foreground/90">Pickup or delivery in Kitengela.</p>
        </div>
      </section>

      <section className="container mx-auto py-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {menu.map((cat) => (
            <div key={cat.id}>
              <h2 className="font-display text-2xl font-bold text-primary mb-4">{cat.title}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {cat.items.map((item) => (
                  <div key={item.name} className="bg-card border border-border rounded-2xl p-4 shadow-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold">{item.name}</h3>
                        {item.tag && <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">{item.tag}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="font-bold text-primary">{formatKES(item.price)}</div>
                      <Button size="sm" variant="hero" onClick={() => add(item.name, item.price)}>
                        <Plus size={16} /> Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit bg-card border border-border rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="text-primary" />
            <h2 className="font-display text-xl font-bold">Your Order</h2>
            <Badge variant="secondary" className="ml-auto">{count}</Badge>
          </div>

          {count === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Your cart is empty. Add something tasty!</p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {Object.values(cart).map((i) => (
                <li key={i.name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{formatKES(i.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => dec(i.name)}><Minus size={14} /></Button>
                    <span className="w-6 text-center text-sm">{i.qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add(i.name, i.price)}><Plus size={14} /></Button>
                  </div>
                  <button aria-label="Remove" onClick={() => remove(i.name)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-between font-display text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatKES(total)}</span>
          </div>
          <Button variant="hero" size="lg" className="w-full mt-4" disabled={count === 0} onClick={() => setCheckoutOpen(true)}>
            Checkout
          </Button>
        </aside>
      </section>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={items}
        total={total}
        onConfirmed={() => setCart({})}
      />
    </Layout>
  );
};

export default Order;
