import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useMenuData } from "@/hooks/useMenuData";
import { useSettings } from "@/hooks/useSettings";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Trash2, MessageCircle, ExternalLink, ImageOff } from "lucide-react";
import { openWhatsApp, openUberEats } from "@/lib/external";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const Menu = () => {
  const navigate = useNavigate();
  const { categories, loading } = useMenuData();
  const { settings } = useSettings();
  const { items, count, subtotal, add, dec, remove } = useCart();

  // map cart by id for quick lookup
  const cartById = Object.fromEntries(items.map((i) => [i.id, i]));

  const goCheckout = () => {
    if (count === 0) return;
    navigate("/checkout");
  };

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Menu</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Made fresh, served hot.</h1>
          <p className="mt-4 max-w-xl mx-auto text-primary-foreground/90">
            Add to your cart and checkout for delivery or pickup.
          </p>
          {settings?.announcement && (
            <div className="mt-4 inline-block bg-secondary text-secondary-foreground rounded-full px-4 py-1.5 text-sm">
              {settings.announcement}
            </div>
          )}
          {settings && !settings.is_open && (
            <div className="mt-4 inline-block bg-destructive text-destructive-foreground rounded-full px-4 py-1.5 text-sm">
              We're closed right now — orders open at {settings.open_time.slice(0, 5)}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {categories.length > 0 && (
          <nav className="flex flex-wrap justify-center gap-2 mb-10 sticky top-[72px] bg-background/85 backdrop-blur py-3 z-30 rounded-full">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#${c.slug}`}
                className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
              >
                {c.title}
              </a>
            ))}
          </nav>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {loading && <p className="text-muted-foreground">Loading menu...</p>}
            {!loading && categories.length === 0 && (
              <p className="text-muted-foreground text-center py-12">Menu is being updated. Please check back soon.</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} id={cat.slug} className="scroll-mt-32">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-5 text-primary">{cat.title}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {cat.items.map((item) => {
                    const inCart = cartById[item.id];
                    return (
                      <article
                        key={item.id}
                        className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-bold transition-shadow flex flex-col"
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-40 bg-muted flex items-center justify-center text-muted-foreground">
                            <ImageOff size={32} />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1 justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                              {item.tag && (
                                <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">{item.tag}</Badge>
                              )}
                            </div>
                            {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="font-display text-lg font-bold text-primary">{formatKES(item.price)}</div>
                            {inCart ? (
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => dec(item.id)}>
                                  <Minus size={14} />
                                </Button>
                                <span className="w-7 text-center text-sm font-semibold">{inCart.qty}</span>
                                <Button size="icon" variant="hero" className="h-8 w-8" onClick={() => add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url })}>
                                  <Plus size={14} />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="hero" onClick={() => add({ id: item.id, name: item.name, price: item.price, image_url: item.image_url })}>
                                <Plus size={16} /> Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit bg-card border border-border rounded-3xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="text-primary" />
              <h2 className="font-display text-xl font-bold">Your Cart</h2>
              <Badge variant="secondary" className="ml-auto">{count}</Badge>
            </div>

            {count === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                Add items from the menu to start your order.
              </p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{formatKES(i.price)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => dec(i.id)}>
                        <Minus size={14} />
                      </Button>
                      <span className="w-6 text-center text-sm">{i.qty}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add({ id: i.id, name: i.name, price: i.price })}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <button aria-label="Remove" onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex items-center justify-between font-display text-lg font-bold">
              <span>Subtotal</span>
              <span className="text-primary">{formatKES(subtotal)}</span>
            </div>
            <Button size="lg" variant="hero" className="w-full mt-4 rounded-full" onClick={goCheckout} disabled={count === 0}>
              Checkout
            </Button>

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

      {/* Floating WhatsApp help button */}
      <button
        aria-label="WhatsApp help & inquiries"
        onClick={() => openWhatsApp("Hello Tikos Kitengela 👋, I have a question.")}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-bold flex items-center justify-center hover:scale-110 transition-transform"
        title="Help & inquiries via WhatsApp"
      >
        <MessageCircle size={26} />
      </button>
    </Layout>
  );
};

export default Menu;
