import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, RefreshCw, Bike, Store, Smartphone, Banknote, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OrderItem = { name: string; price: number; qty: number };
type Order = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  fulfilment: "delivery" | "pickup";
  address: string | null;
  payment_method: "cash" | "mpesa";
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
};

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const PASS_KEY = "tikos_admin_passcode";

const AdminOrders = () => {
  const [passcode, setPasscode] = useState(sessionStorage.getItem(PASS_KEY) ?? "");
  const [authed, setAuthed] = useState(!!sessionStorage.getItem(PASS_KEY));
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async (code: string) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-orders", {
      headers: { "x-admin-passcode": code },
    });
    setLoading(false);
    if (error || !data?.orders) {
      toast.error("Could not load orders", { description: error?.message ?? data?.error });
      sessionStorage.removeItem(PASS_KEY);
      setAuthed(false);
      return;
    }
    setOrders(data.orders as Order[]);
  };

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passcode) return;
    sessionStorage.setItem(PASS_KEY, passcode);
    setAuthed(true);
    await fetchOrders(passcode);
  };

  const logout = () => {
    sessionStorage.removeItem(PASS_KEY);
    setPasscode("");
    setAuthed(false);
    setOrders([]);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <form onSubmit={onLogin} className="bg-card border border-border rounded-3xl p-8 shadow-card w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full gradient-hero text-primary-foreground mb-3">
              <Lock size={22} />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the staff passcode to view orders.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Unlock"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Orders</h1>
            <p className="text-sm text-muted-foreground">{orders.length} order{orders.length === 1 ? "" : "s"} · most recent first</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchOrders(passcode)} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {orders.length === 0 && !loading && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            No orders yet. They'll appear here as customers check out.
          </div>
        )}

        <div className="grid gap-4">
          {orders.map((o) => (
            <article key={o.id} className="bg-card border border-border rounded-2xl shadow-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-lg font-bold text-primary tracking-wider">{o.reference}</span>
                    <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                    <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary capitalize inline-flex items-center gap-1">
                      {o.fulfilment === "delivery" ? <Bike size={12} /> : <Store size={12} />}
                      {o.fulfilment}
                    </Badge>
                    <Badge variant="outline" className="capitalize inline-flex items-center gap-1">
                      {o.payment_method === "mpesa" ? <Smartphone size={12} /> : <Banknote size={12} />}
                      {o.payment_method === "mpesa" ? "M-Pesa" : "Cash"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-primary">{formatKES(o.total)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatKES(o.subtotal)}{o.delivery_fee > 0 ? ` + ${formatKES(o.delivery_fee)} delivery` : ""}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Customer</div>
                  <div className="font-medium">{o.customer_name}</div>
                  <a href={`tel:${o.phone}`} className="text-sm text-primary hover:underline">{o.phone}</a>
                  {o.address && <div className="text-sm text-muted-foreground mt-1">{o.address}</div>}
                  {o.notes && (
                    <div className="mt-2 text-sm bg-muted rounded-lg p-2">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Notes:</span> {o.notes}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Items</div>
                  <ul className="space-y-1 text-sm">
                    {o.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="truncate">{it.qty}× {it.name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{formatKES(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
