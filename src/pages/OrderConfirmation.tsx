import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { CheckCircle2, Copy, Bike, Store, Banknote, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

type Order = {
  reference: string;
  customer_name: string;
  phone: string;
  fulfilment: "delivery" | "pickup";
  address: string | null;
  payment_method: string;
  items: { name: string; price: number; qty: number }[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
};

const STATUS_FLOW = ["new", "preparing", "out_for_delivery", "delivered"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "Order received",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const OrderConfirmation = () => {
  const { reference } = useParams<{ reference: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) return;
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("reference, customer_name, phone, fulfilment, address, payment_method, items, subtotal, delivery_fee, discount, total, status, created_at")
        .eq("reference", reference)
        .maybeSingle();
      setOrder(data as Order | null);
      setLoading(false);
    };
    load();

    // realtime subscribe to status changes
    const channel = supabase
      .channel(`order-${reference}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `reference=eq.${reference}` }, (payload) => {
        setOrder((o) => (o ? { ...o, ...(payload.new as Order) } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [reference]);

  const copyRef = async () => {
    if (!reference) return;
    await navigator.clipboard.writeText(reference);
    toast.success("Reference copied");
  };

  if (loading) {
    return <Layout><div className="container mx-auto py-20 text-center text-muted-foreground">Loading order...</div></Layout>;
  }
  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Order not found</h1>
          <p className="text-muted-foreground mt-2">We couldn't find an order with reference {reference}.</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/menu">Back to menu</Link></Button>
        </div>
      </Layout>
    );
  }

  const flow = order.fulfilment === "pickup"
    ? ["new", "preparing", "delivered"]
    : STATUS_FLOW;
  const stepIdx = flow.indexOf(order.status);

  return (
    <Layout>
      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-card text-center">
          <div className="inline-flex p-4 rounded-full gradient-hero text-primary-foreground mb-3">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Thanks, {order.customer_name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-2">
            Your {order.fulfilment} order is confirmed. We'll call you on {order.phone} if needed.
          </p>

          <div className="mt-5 inline-flex items-center gap-3 bg-muted rounded-2xl px-5 py-3">
            <div className="text-left">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Reference</div>
              <div className="font-display text-2xl font-bold text-primary tracking-wider">{order.reference}</div>
            </div>
            <button onClick={copyRef} className="p-2 rounded-full hover:bg-background"><Copy size={16} /></button>
          </div>
        </div>

        {/* Status tracker */}
        <div className="bg-card border border-border rounded-3xl p-6 mt-6">
          <h2 className="font-display text-lg font-bold mb-4">Order status</h2>
          {order.status === "cancelled" ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : (
            <ol className="grid grid-cols-3 sm:grid-cols-4 gap-2 relative">
              {flow.map((s, idx) => {
                const done = idx <= stepIdx;
                return (
                  <li key={s} className="flex flex-col items-center text-center">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {idx + 1}
                    </div>
                    <div className={`text-xs mt-2 ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {STATUS_LABEL[s]}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Details */}
        <div className="bg-card border border-border rounded-3xl p-6 mt-6">
          <h2 className="font-display text-lg font-bold mb-4">Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {order.fulfilment === "delivery" ? <Bike size={16} className="text-primary" /> : <Store size={16} className="text-primary" />}
              <span className="capitalize">{order.fulfilment}</span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-primary" />
              <span>Cash on {order.fulfilment === "delivery" ? "delivery" : "pickup"}</span>
            </div>
            {order.address && <div className="sm:col-span-2 text-muted-foreground"><strong className="text-foreground">Address:</strong> {order.address}</div>}
            <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} /> {order.phone}</div>
          </div>

          <ul className="mt-5 space-y-2 text-sm border-t border-border pt-4">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <span>{i.qty}× {i.name}</span>
                <span className="text-muted-foreground">{formatKES(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKES(order.subtotal)}</span></div>
            {order.delivery_fee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatKES(order.delivery_fee)}</span></div>}
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatKES(order.discount)}</span></div>}
            <div className="flex justify-between font-display text-lg font-bold pt-2 border-t border-border"><span>Total</span><span className="text-primary">{formatKES(order.total)}</span></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          <Button asChild variant="outline"><Link to="/menu">Order again</Link></Button>
          <Button asChild variant="hero"><Link to="/account">View my orders <ArrowRight size={16} /></Link></Button>
        </div>
      </section>
    </Layout>
  );
};

export default OrderConfirmation;
