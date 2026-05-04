import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Lock, RefreshCw, Bike, Store, Smartphone, Banknote, LogOut,
  Users, CalendarDays, ShoppingBag, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OrderItem = { name: string; price: number; qty: number };
type Order = {
  id: string; reference: string; customer_name: string; phone: string;
  fulfilment: "delivery" | "pickup"; address: string | null;
  payment_method: "cash" | "mpesa"; notes: string | null;
  items: OrderItem[]; subtotal: number; delivery_fee: number; total: number;
  status: string; created_at: string;
};
type AdminUser = {
  id: string; email: string | null; created_at: string;
  last_sign_in_at: string | null; provider: string;
  display_name: string | null; phone: string | null;
};
type Reservation = {
  id: string; reference: string; name: string; phone: string; email: string | null;
  party_size: number; reservation_date: string; reservation_time: string;
  notes: string | null; created_at: string;
};
type Stats = {
  totalOrders: number; ordersToday: number; revenue: number;
  byStatus: Record<string, number>; totalUsers: number; totalReservations: number;
};

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;
const PASS_KEY = "tikos_admin_passcode";
const STATUS_OPTIONS = ["new", "preparing", "out_for_delivery", "delivered", "cancelled", "completed"];

const statusColor = (s: string) => {
  switch (s) {
    case "delivered":
    case "completed": return "bg-green-500/15 text-green-700 border-green-500/30";
    case "cancelled": return "bg-destructive/15 text-destructive border-destructive/30";
    case "out_for_delivery": return "bg-blue-500/15 text-blue-700 border-blue-500/30";
    case "preparing": return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
    default: return "bg-muted text-foreground border-border";
  }
};

const AdminOrders = () => {
  const [passcode, setPasscode] = useState(sessionStorage.getItem(PASS_KEY) ?? "");
  const [authed, setAuthed] = useState(!!sessionStorage.getItem(PASS_KEY));
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchAll = async (code = passcode) => {
    setLoading(true);
    try {
      sessionStorage.setItem(PASS_KEY, code);
      const headers = { "x-admin-passcode": code };
      const [o, u, r, s] = await Promise.all([
        supabase.functions.invoke("admin-orders?resource=orders", { headers }),
        supabase.functions.invoke("admin-orders?resource=users", { headers }),
        supabase.functions.invoke("admin-orders?resource=reservations", { headers }),
        supabase.functions.invoke("admin-orders?resource=stats", { headers }),
      ]);
      if (o.error || o.data?.error) throw new Error(o.data?.error ?? o.error?.message);
      setOrders(o.data.orders ?? []);
      setUsers(u.data?.users ?? []);
      setReservations(r.data?.reservations ?? []);
      setStats(s.data?.stats ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load data";
      toast.error("Could not load data", { description: msg });
      sessionStorage.removeItem(PASS_KEY);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passcode) return;
    setAuthed(true);
    await fetchAll(passcode);
  };

  const logout = () => {
    sessionStorage.removeItem(PASS_KEY);
    setPasscode(""); setAuthed(false);
    setOrders([]); setUsers([]); setReservations([]); setStats(null);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-orders?resource=update-order",
        { headers: { "x-admin-passcode": passcode }, body: { id, status } },
      );
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success("Order updated");
    } catch (e: unknown) {
      toast.error("Update failed", { description: e instanceof Error ? e.message : "" });
    }
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
            <p className="text-sm text-muted-foreground mt-1">Enter the staff passcode to view the dashboard.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode</Label>
            <Input id="passcode" type="password" autoFocus value={passcode}
              onChange={(e) => setPasscode(e.target.value)} placeholder="••••••" />
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
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Tikos Kitengela · live operations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAll()} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="reservations">Bookings ({reservations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<ShoppingBag />} label="Orders today" value={stats?.ordersToday ?? 0} />
              <StatCard icon={<TrendingUp />} label="Total revenue" value={formatKES(stats?.revenue ?? 0)} />
              <StatCard icon={<Users />} label="Registered users" value={stats?.totalUsers ?? 0} />
              <StatCard icon={<CalendarDays />} label="Reservations" value={stats?.totalReservations ?? 0} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 mt-6">
              <h2 className="font-display text-lg font-bold mb-4">Order status breakdown</h2>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <div key={s} className={`px-3 py-2 rounded-full border text-sm capitalize ${statusColor(s)}`}>
                    {s.replace(/_/g, " ")}: <strong>{stats?.byStatus?.[s] ?? 0}</strong>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note: orders placed via Uber Eats are tracked in your Uber Eats Manager, not here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <EmptyState text="No orders yet. They'll appear here as customers check out." />
            ) : (
              <div className="grid gap-4">
                {orders.map((o) => (
                  <article key={o.id} className="bg-card border border-border rounded-2xl shadow-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-lg font-bold text-primary tracking-wider">{o.reference}</span>
                          <Badge variant="outline" className={`capitalize ${statusColor(o.status)}`}>{o.status.replace(/_/g, " ")}</Badge>
                          <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary capitalize inline-flex items-center gap-1">
                            {o.fulfilment === "delivery" ? <Bike size={12} /> : <Store size={12} />}
                            {o.fulfilment}
                          </Badge>
                          <Badge variant="outline" className="capitalize inline-flex items-center gap-1">
                            {o.payment_method === "mpesa" ? <Smartphone size={12} /> : <Banknote size={12} />}
                            {o.payment_method === "mpesa" ? "M-Pesa" : "Cash"}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
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

                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 flex-wrap">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Update status</span>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {users.length === 0 ? (
              <EmptyState text="No registered users yet." />
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last sign in</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.display_name ?? "—"}</TableCell>
                        <TableCell>{u.email ?? "—"}</TableCell>
                        <TableCell>{u.phone ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{u.provider}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            {reservations.length === 0 ? (
              <EmptyState text="No reservations yet." />
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date / Time</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs text-primary">{r.reference}</TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          {new Date(r.reservation_date).toLocaleDateString()} · {r.reservation_time.slice(0,5)}
                        </TableCell>
                        <TableCell>{r.party_size}</TableCell>
                        <TableCell><a href={`tel:${r.phone}`} className="text-primary hover:underline">{r.phone}</a></TableCell>
                        <TableCell className="text-sm">{r.email ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="p-2 rounded-full bg-primary/10 text-primary">{icon}</span>
    </div>
    <div className="font-display text-3xl font-bold mt-2">{value}</div>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">{text}</div>
);

export default AdminOrders;
