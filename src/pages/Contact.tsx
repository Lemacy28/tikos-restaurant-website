import Layout from "@/components/Layout";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter } from "lucide-react";

const Contact = () => {
  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Contact</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Come say hi</h1>
          <p className="mt-3 max-w-xl mx-auto text-primary-foreground/90">We're easy to find — and even easier to love.</p>
        </div>
      </section>

      <section className="container mx-auto py-16 grid lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary h-fit"><MapPin /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Location</h3>
              <p className="text-muted-foreground">EPZ Road, Kitengela Town<br />Kajiado County, Kenya</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary h-fit"><Phone /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Phone</h3>
              <a href="tel:+254712345678" className="text-muted-foreground hover:text-primary">+254 712 345 678</a>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary h-fit"><Mail /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Email</h3>
              <a href="mailto:hello@tikos.co.ke" className="text-muted-foreground hover:text-primary">hello@tikos.co.ke</a>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary h-fit"><Clock /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">Hours</h3>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>Mon – Thu · 10:00 AM – 10:00 PM</li>
                <li>Fri – Sat · 10:00 AM – 12:00 AM</li>
                <li>Sunday · 11:00 AM – 10:00 PM</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer" className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary-deep transition-colors"><Instagram /></a>
            <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer" className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary-deep transition-colors"><Facebook /></a>
            <a aria-label="Twitter" href="https://twitter.com" target="_blank" rel="noreferrer" className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary-deep transition-colors"><Twitter /></a>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-bold border border-border min-h-[420px]">
          <iframe
            title="Tikos location in Kitengela"
            src="https://www.google.com/maps?q=Kitengela,Kenya&output=embed"
            className="w-full h-full min-h-[420px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
