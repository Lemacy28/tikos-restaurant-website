import Layout from "@/components/Layout";
import { menu } from "@/data/menu";
import { Badge } from "@/components/ui/badge";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const Menu = () => {
  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 md:py-24 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Menu</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Made fresh, served hot.</h1>
          <p className="mt-4 max-w-xl mx-auto text-primary-foreground/90">
            Browse our full menu — prices in Kenyan Shillings, updated regularly.
          </p>
        </div>
      </section>

      <section className="container mx-auto py-16">
        <nav className="flex flex-wrap justify-center gap-2 mb-12 sticky top-[72px] bg-background/85 backdrop-blur py-3 z-30 rounded-full">
          {menu.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors border border-border">
              {c.title}
            </a>
          ))}
        </nav>

        <div className="space-y-16">
          {menu.map((cat) => (
            <div key={cat.id} id={cat.id} className="scroll-mt-32">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-primary">{cat.title}</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {cat.items.map((item) => (
                  <article key={item.name} className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-bold transition-shadow">
                    <div className="flex justify-between gap-4 items-start">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                          {item.tag && <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">{item.tag}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <div className="font-display text-lg font-bold text-primary whitespace-nowrap">{formatKES(item.price)}</div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Menu;
