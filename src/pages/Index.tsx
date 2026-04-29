import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { ArrowRight, Star, Clock, MapPin, Utensils, ExternalLink } from "lucide-react";
import { UBER_EATS_URL } from "@/lib/external";
import hero from "@/assets/hero-chicken.jpg";
import mascot from "@/assets/chicken-mascot.png";
import wings from "@/assets/gallery-wings.jpg";
import burger from "@/assets/gallery-burger.jpg";
import drinks from "@/assets/gallery-drinks.jpg";

const Index = () => {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center py-20 lg:py-28">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-sm font-medium backdrop-blur-sm">
              <Star size={14} className="fill-secondary text-secondary" /> Now open in Kitengela
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mt-6 leading-[1.05] text-balance">
              Crispy. Juicy. <span className="text-secondary">Tikos.</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-primary-foreground/90 max-w-lg">
              Kitengela's freshest spot for legendary fried chicken, bold flavors, and good vibes — cooked with love, served with a smile.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="cta" size="xl">
                <a href={UBER_EATS_URL} target="_blank" rel="noopener noreferrer">Order on Uber Eats <ExternalLink size={16} /></a>
              </Button>
              <Button asChild variant="outlineHero" size="xl">
                <Link to="/reservations">Book a Table</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src={hero}
              alt="Tikos signature crispy chicken platter"
              className="rounded-3xl shadow-bold w-full object-cover aspect-[4/3]"
              width={1536}
              height={1024}
            />
            <img
              src={mascot}
              alt=""
              className="absolute -bottom-6 -left-6 w-32 md:w-44 animate-float drop-shadow-2xl"
              width={176}
              height={176}
            />
          </div>
        </div>
        {/* decorative blob */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </section>

      {/* QUICK INFO STRIP */}
      <section className="container mx-auto -mt-10 relative z-10">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, title: "Open Today", text: "10:00 AM – 10:00 PM" },
            { icon: MapPin, title: "Find Us", text: "EPZ Road, Kitengela" },
            { icon: Utensils, title: "Dine · Take · Deliver", text: "All ways to enjoy" },
          ].map((item) => (
            <div key={item.title} className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 border border-border">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <item.icon size={22} />
              </div>
              <div>
                <div className="font-display font-semibold">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTRO */}
      <section className="container mx-auto py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">Welcome to Tikos</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 leading-tight">
            A taste of Kitengela's <span className="text-primary">new favorite</span>.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Tikos is a fresh, family-friendly restaurant serving up irresistible chicken, hearty meals,
            refreshing drinks and the kind of warmth that turns visitors into regulars. Whether you're
            grabbing a quick bite or settling in with friends, we make every plate count.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-7">
            <Link to="/about">Our Story <ArrowRight /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <img src={wings} alt="Spicy chicken wings" className="rounded-2xl aspect-square object-cover shadow-card" loading="lazy" width={1024} height={1024} />
          <img src={burger} alt="Crispy chicken burger" className="rounded-2xl aspect-square object-cover shadow-card mt-8" loading="lazy" width={1024} height={1024} />
          <img src={drinks} alt="Refreshing drinks" className="rounded-2xl aspect-square object-cover shadow-card -mt-4" loading="lazy" width={1024} height={1024} />
          <div className="rounded-2xl aspect-square bg-primary text-primary-foreground p-6 flex flex-col justify-end shadow-bold mt-4">
            <div className="font-display text-3xl font-bold">100%</div>
            <div className="text-sm opacity-90">Fresh, locally sourced ingredients every single day.</div>
          </div>
        </div>
      </section>

      {/* REVIEWS PREVIEW */}
      <section className="bg-muted py-20">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Loved by Kitengela</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">What guests are saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Wanjiku M.", text: "The crispy bucket is unreal. Best chicken in Kitengela, hands down!" },
              { name: "Brian O.", text: "Cozy spot, great service, and the spicy wings? 🔥 I'll be back weekly." },
              { name: "Aisha K.", text: "Fast delivery, generous portions, and that strawberry mojito is heaven." },
            ].map((r) => (
              <div key={r.name} className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <div className="flex gap-1 text-secondary mb-3">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className="fill-secondary" />)}
                </div>
                <p className="text-foreground/90">"{r.text}"</p>
                <div className="mt-4 font-display font-semibold">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto py-20">
        <div className="gradient-hero text-primary-foreground rounded-3xl p-10 md:p-16 text-center shadow-bold relative overflow-hidden">
          <img src={mascot} alt="" className="absolute -bottom-6 -right-6 w-40 md:w-56 opacity-90 animate-float" width={224} height={224} loading="lazy" />
          <h2 className="font-display text-4xl md:text-5xl font-bold">Hungry yet?</h2>
          <p className="mt-3 text-lg text-primary-foreground/90 max-w-xl mx-auto">Order online for delivery or pick-up — your favorite meal is just a few clicks away.</p>
          <div className="mt-7 flex justify-center flex-wrap gap-3">
            <Button asChild variant="cta" size="xl"><a href={UBER_EATS_URL} target="_blank" rel="noopener noreferrer">Order on Uber Eats</a></Button>
            <Button asChild variant="outlineHero" size="xl"><Link to="/menu">View Menu</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
