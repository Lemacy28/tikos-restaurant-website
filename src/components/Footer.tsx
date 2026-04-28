import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";
import mascot from "@/assets/chicken-mascot.png";

const Footer = () => {
  return (
    <footer className="bg-primary-deep text-primary-foreground mt-20">
      <div className="container mx-auto py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src={mascot} alt="" className="h-12 w-12" width={48} height={48} loading="lazy" />
            <span className="font-display text-2xl font-bold">Tikos</span>
          </div>
          <p className="text-primary-foreground/80 text-sm">Crispy. Juicy. Unforgettable. Kitengela's new home of flavor.</p>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">Visit</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/85">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> EPZ Road, Kitengela, Kajiado</li>
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0" /> +254 712 345 678</li>
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0" /> hello@tikos.co.ke</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">Hours</h4>
          <ul className="space-y-1 text-sm text-primary-foreground/85">
            <li>Mon – Thu · 10am – 10pm</li>
            <li>Fri – Sat · 10am – 12am</li>
            <li>Sunday · 11am – 10pm</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">Explore</h4>
          <ul className="space-y-1 text-sm">
            <li><Link to="/menu" className="hover:underline">Menu</Link></li>
            <li><Link to="/reservations" className="hover:underline">Reservations</Link></li>
            <li><Link to="/order" className="hover:underline">Order Online</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
          </ul>
          <div className="flex gap-3 mt-4">
            <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-primary-foreground/10 rounded-full hover:bg-primary-foreground hover:text-primary transition-colors"><Instagram size={18} /></a>
            <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-primary-foreground/10 rounded-full hover:bg-primary-foreground hover:text-primary transition-colors"><Facebook size={18} /></a>
            <a aria-label="Twitter" href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-primary-foreground/10 rounded-full hover:bg-primary-foreground hover:text-primary transition-colors"><Twitter size={18} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Tikos Restaurant · Kitengela, Kenya
      </div>
    </footer>
  );
};

export default Footer;
