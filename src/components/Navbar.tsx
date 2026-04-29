import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, User as UserIcon, LogIn } from "lucide-react";
import mascot from "@/assets/chicken-mascot.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reservations", label: "Reservations" },
  { to: "/order", label: "Order" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-lg border-b border-border">
      <nav className="container mx-auto flex items-center justify-between py-3 gap-3">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <img src={mascot} alt="Tikos chicken mascot" className="h-12 w-12 group-hover:animate-wiggle" width={48} height={48} />
          <div className="leading-none">
            <div className="font-display text-2xl font-bold text-primary">Tikos</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Kitengela</div>
          </div>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/account"><UserIcon size={14} /> Account</Link>
            </Button>
          ) : (
            <Button asChild variant="hero" size="sm" className="rounded-full">
              <Link to="/auth"><LogIn size={14} /> Sign in</Link>
            </Button>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden p-2 rounded-full hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <ul className="container mx-auto py-3 flex flex-col">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-4 py-3 rounded-lg font-medium",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2 border-t border-border mt-2">
              <NavLink
                to={user ? "/account" : "/auth"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg font-medium",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )
                }
              >
                {user ? <><UserIcon size={16} /> My Account</> : <><LogIn size={16} /> Sign in / Register</>}
              </NavLink>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
