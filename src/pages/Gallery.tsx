import Layout from "@/components/Layout";
import hero from "@/assets/hero-chicken.jpg";
import wings from "@/assets/gallery-wings.jpg";
import burger from "@/assets/gallery-burger.jpg";
import drinks from "@/assets/gallery-drinks.jpg";
import ambience from "@/assets/gallery-ambience.jpg";

const images = [
  { src: hero, alt: "Crispy chicken platter", span: "md:col-span-2 md:row-span-2" },
  { src: ambience, alt: "Restaurant ambience" },
  { src: wings, alt: "Spicy wings" },
  { src: burger, alt: "Chicken burger" },
  { src: drinks, alt: "Refreshing drinks" },
];

const Gallery = () => {
  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Gallery</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">A taste in pictures</h1>
          <p className="mt-3 max-w-xl mx-auto text-primary-foreground/90">Our food, our space, our vibe.</p>
        </div>
      </section>

      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-4 grid-flow-row-dense gap-4 auto-rows-[200px]">
          {images.map((img) => (
            <div key={img.alt} className={`overflow-hidden rounded-2xl shadow-card group ${img.span ?? ""}`}>
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                width={1024}
                height={1024}
              />
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Gallery;
