import Layout from "@/components/Layout";
import mascot from "@/assets/chicken-mascot.png";
import ambience from "@/assets/gallery-ambience.jpg";
import { Heart, Leaf, Users } from "lucide-react";

const About = () => {
  return (
    <Layout>
      <section className="container mx-auto py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Story</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-3 leading-tight">
            Born in <span className="text-primary">Kitengela</span>, made for everyone.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Tikos started with a simple idea: bring honest, mouth-watering food to our hometown,
            served in a place that feels like family. From our perfectly crispy chicken to our
            secret-recipe sauces, every dish is a labour of love — cooked fresh, plated with care
            and shared with pride.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We believe great food brings people together. So whether it's a casual lunch, a date
            night, or a family celebration — Tikos is your spot.
          </p>
        </div>
        <div className="relative">
          <img src={ambience} alt="Tikos restaurant interior" className="rounded-3xl shadow-bold w-full object-cover aspect-square" loading="lazy" width={1024} height={1024} />
          <img src={mascot} alt="" className="absolute -top-6 -right-6 w-28 md:w-36 animate-wiggle" width={144} height={144} loading="lazy" />
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto">
          <h2 className="font-display text-4xl font-bold text-center mb-12">What we stand for</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Made with love", text: "Every plate is cooked with care, just like home." },
              { icon: Leaf, title: "Fresh, local", text: "We source from Kenyan farmers and suppliers daily." },
              { icon: Users, title: "Community first", text: "Tikos is a gathering place — kids, families, friends." },
            ].map((v) => (
              <div key={v.title} className="bg-card rounded-2xl p-7 shadow-card border border-border text-center">
                <div className="inline-flex p-4 rounded-full gradient-hero text-primary-foreground mb-4">
                  <v.icon size={26} />
                </div>
                <h3 className="font-display text-xl font-semibold">{v.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
