import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { LogOut, User as UserIcon, Mail, Phone, ExternalLink, ShoppingBag } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UBER_EATS_URL } from "@/lib/external";

type Profile = { display_name: string | null; phone: string | null };
type OrderRow = {
  id: string;
  reference: string;
  total: number;
  status: string;
  created_at: string;
  fulfilment: string;
  payment_method: string;
};

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>({ display_name: "", phone: "" });
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (p) setProfile({ display_name: p.display_name ?? "", phone: p.phone ?? "" });

      const { data: o } = await supabase
        .from("orders")
        .select("id, reference, total, status, created_at, fulfilment, payment_method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (o) setOrders(o as OrderRow[]);
    })();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: "/account" }} replace />;

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, display_name: profile.display_name, phone: profile.phone },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) return toast.error("Couldn't save", { description: error.message });
    toast.success("Profile updated");
  };

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-12 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">My Account</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">
            Hey {profile.display_name?.split(" ")[0] || "there"} 👋
          </h1>
        </div>
      </section>

      <section className="container mx-auto py-12 grid lg:grid-cols-3 gap-8">
        {/* Profile */}
        <form onSubmit={saveProfile} className="bg-card border border-border rounded-3xl shadow-card p-6 space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary"><UserIcon size={20} /></div>
            <h2 className="font-display text-xl font-bold">Profile</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground">
              <Mail size={14} /> {user.email}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Full name</Label>
            <Input
              id="display_name"
              value={profile.display_name ?? ""}
              maxLength={100}
              onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone ?? ""}
              maxLength={25}
              placeholder="+254 ..."
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </form>

        {/* Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="text-primary" /> My Orders
            </h2>
            <Button asChild variant="cta" size="sm">
              <a href={UBER_EATS_URL} target="_blank" rel="noopener noreferrer">
                Order on Uber Eats <ExternalLink size={14} />
              </a>
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
              <p>No orders yet.</p>
              <p className="text-sm mt-1">
                Tikos orders are fulfilled via Uber Eats — your Uber Eats history lives in the Uber Eats app.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/order-confirmation/${o.reference}`} className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-center justify-between hover:border-primary transition-colors">
                    <div>
                      <div className="font-display font-bold text-primary tracking-wider">{o.reference}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()} · <span className="capitalize">{o.fulfilment}</span> · <span className="capitalize">{o.payment_method}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold">{formatKES(o.total)}</div>
                      <Badge variant="secondary" className="capitalize mt-1">{o.status.replace(/_/g, " ")}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Account;
