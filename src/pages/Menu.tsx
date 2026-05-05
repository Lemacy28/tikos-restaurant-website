import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { menu } from "@/data/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Trash2, MessageCircle, ExternalLink } from "lucide-react";
import { openWhatsApp, openUberEats } from "@/lib/external";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

type Cart = Record<string, { name: string; price: number; qty: number }>;

const Menu = () => {
  const [cart, setCart] = useState<Cart>({});

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
  const remove = (name: string) =>
    setCart((c) => {
      const { [name]: _, ...rest } = c;
      return rest;
    });

  const items = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const orderOnWhatsApp = () => {
    const lines = [
      "Hello Tikos Kitengela 👋, I'd like to place an order:",
      "",
      ...items.map((i) => `• ${i.qty} x ${i.name} — ${formatKES(i.price * i.qty)}`),
      "",
      `Estimated total: ${formatKES(total)}`,
    ];
    openWhatsApp(lines.join("\n"));
  };

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Menu</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Made fresh, served hot.</h1>
          <p className="mt-4 max-w-xl mx-auto text-primary-foreground/90">
            Tap "Add" to build your order, then send it straight to us on WhatsApp.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <nav className="flex flex-wrap justify-center gap-2 mb-10 sticky top-[72px] bg-background/85 backdrop-blur py-3 z-30 rounded-full">
          {menu.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
            >
              {c.title}
            </a>
          ))}
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {menu.map((cat) => (
              <div key={cat.id} id={cat.id} className="scroll-mt-32">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-5 text-primary">{cat.title}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {cat.items.map((item) => (
                    <article
                      key={item.name}
                      className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-bold transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                          {item.tag && (
                            <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">{item.tag}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="font-display text-lg font-bold text-primary">{formatKES(item.price)}</div>
                        {cart[item.name] ? (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => dec(item.name)}>
                              <Minus size={14} />
                            </Button>
                            <span className="w-7 text-center text-sm font-semibold">{cart[item.name].qty}</span>
                            <Button size="icon" variant="hero" className="h-8 w-8" onClick={() => add(item.name, item.price)}>
                              <Plus size={14} />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="hero" onClick={() => add(item.name, item.price)}>
                            <Plus size={16} /> Add
                          </Button>
                        )}
                      </div>
                    </article>
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
              <p className="text-sm text-muted-foreground py-10 text-center">
                Add items from the menu, then send your order to us on WhatsApp.
              </p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{formatKES(i.price)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => dec(i.name)}>
                        <Minus size={14} />
                      </Button>
                      <span className="w-6 text-center text-sm">{i.qty}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add(i.name, i.price)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <button
                      aria-label="Remove"
                      onClick={() => remove(i.name)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex items-center justify-between font-display text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatKES(total)}</span>
            </div>
            <Button
              size="lg"
              className="w-full mt-4 bg-[#25D366] text-white hover:bg-[#1ebe57] rounded-full font-display font-semibold"
              onClick={orderOnWhatsApp}
              disabled={count === 0}
            >
              <MessageCircle size={18} /> Order on WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Opens WhatsApp chat with Tikos Kitengela (0729 088 088).
            </p>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" size="lg" className="w-full rounded-full" onClick={openUberEats}>
              Order on Uber Eats <ExternalLink size={16} />
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Delivery handled by Uber Eats — final pricing shown there.
            </p>
          </aside>
        </div>
      </section>

      {/* Floating WhatsApp button */}
      <button
        aria-label="Chat on WhatsApp"
        onClick={() =>
          openWhatsApp("Hello Tikos Kitengela 👋, I'd like to place an order.")
        }
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-bold flex items-center justify-center hover:scale-110 transition-transform"
      >
        <MessageCircle size={26} />
      </button>
    </Layout>
  );
};

export default Menu;
