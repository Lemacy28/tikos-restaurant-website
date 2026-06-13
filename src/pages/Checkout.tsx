import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Bike, Store, Smartphone, Banknote, ArrowLeft, Tag } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const baseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(25),
  notes: z.string().max(500).optional(),
});
const deliverySchema = baseSchema.extend({
  mode: z.literal("delivery"),
  address: z.string().trim().min(5, "Please enter your delivery address").max(250),
});
const pickupSchema = baseSchema.extend({
  mode: z.literal("pickup"),
  address: z.string().optional(),
});
const schema = z.discriminatedUnion("mode", [deliverySchema, pickupSchema]);

const Checkout = () => {
  const nav = useNavigate();
  const { items, subtotal, count, clear } = useCart();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [payment] = useState<"cash">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ display_name?: string | null; phone?: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, phone").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  useEffect(() => {
    if (count === 0) nav("/menu", { replace: true });
  }, [count, nav]);

  const fee = mode === "delivery" && settings ? settings.delivery_fee : 0;
  const total = useMemo(() => Math.max(0, subtotal + fee - discount), [subtotal, fee, discount]);

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase.rpc("validate_promo_code", {
      _code: code,
      _subtotal: subtotal,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || !row.valid) {
      toast.error(row?.message ?? "Invalid or expired code");
      return;
    }
    setDiscount(row.discount);
    setAppliedCode(code);
    toast.success(`Code applied — saved ${formatKES(row.discount)}`);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (settings && !settings.is_open) {
      toast.error("Sorry, we're closed right now");
      return;
    }
    if (settings && subtotal < settings.min_order) {
      toast.error(`Minimum order is ${formatKES(settings.min_order)}`);
      return;
    }
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      mode,
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      address: String(fd.get("address") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check your details");
      return;
    }

    setSubmitting(true);
    const orderItems = items.map((i) => ({ name: i.name, price: i.price, qty: i.qty }));
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: parsed.data.name,
        phone: parsed.data.phone,
        fulfilment: mode,
        address: parsed.data.mode === "delivery" ? parsed.data.address : null,
        payment_method: payment,
        notes: parsed.data.notes || null,
        items: orderItems,
        subtotal,
        delivery_fee: fee,
        discount,
        promo_code: appliedCode,
        total,
        user_id: user?.id ?? null,
      })
      .select("reference")
      .single();
    setSubmitting(false);

    if (error || !data) {
      toast.error("Could not place order", { description: error?.message });
      return;
    }
    toast.success("Order placed!");
    clear();
    nav(`/order-confirmation/${data.reference}`);
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/menu" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft size={16} /> Back to menu
        </Link>
        <h1 className="font-display text-4xl md:text-5xl font-bold">Checkout</h1>
        <p className="text-muted-foreground mt-1">Confirm your details and we'll start cooking.</p>

        <form onSubmit={onSubmit} className="mt-8 grid md:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-5">
            {/* Fulfilment */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <Label className="mb-3 block font-semibold">How would you like it?</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "delivery" as const, label: "Delivery", icon: Bike, enabled: settings?.delivery_enabled ?? true },
                  { value: "pickup" as const, label: "Pickup", icon: Store, enabled: settings?.pickup_enabled ?? true },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!opt.enabled}
                    onClick={() => setMode(opt.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                      mode === opt.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    <opt.icon size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" required maxLength={100} defaultValue={profile?.display_name ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required type="tel" maxLength={25} placeholder="07..." defaultValue={profile?.phone ?? ""} />
                </div>
              </div>
              {mode === "delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery address</Label>
                  <Textarea id="address" name="address" required maxLength={250} rows={2} placeholder="Estate, street, house/apt, landmark" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" name="notes" maxLength={500} rows={2} placeholder="Allergies, no onions, gate code..." />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <Label className="mb-3 block font-semibold">Payment</Label>
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex items-center gap-3">
                <Banknote className="text-primary" />
                <div>
                  <div className="font-medium">Cash on {mode === "delivery" ? "delivery" : "pickup"}</div>
                  <div className="text-xs text-muted-foreground">Pay when your order arrives.</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Smartphone size={14} /> M-Pesa coming soon.
              </div>
            </div>

            {/* Promo */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <Label className="mb-2 block font-semibold inline-flex items-center gap-1.5"><Tag size={14} /> Promo code</Label>
              <div className="flex gap-2">
                <Input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="e.g. TIKOS10" disabled={!!appliedCode} />
                {appliedCode ? (
                  <Button type="button" variant="outline" onClick={() => { setAppliedCode(null); setDiscount(0); setPromo(""); }}>Remove</Button>
                ) : (
                  <Button type="button" variant="outline" onClick={applyPromo}>Apply</Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="bg-card border border-border rounded-2xl p-5 h-fit md:sticky md:top-24">
            <h2 className="font-display text-lg font-bold mb-3">Order summary</h2>
            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-1">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="truncate">{i.qty}× {i.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{formatKES(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKES(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{mode === "delivery" ? "Delivery fee" : "Pickup"}</span><span>{mode === "delivery" ? formatKES(fee) : "Free"}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({appliedCode})</span><span>−{formatKES(discount)}</span></div>
              )}
              <div className="flex justify-between font-display text-lg font-bold pt-2 border-t border-border"><span>Total</span><span className="text-primary">{formatKES(total)}</span></div>
            </div>
            {settings && subtotal < settings.min_order && (
              <p className="text-xs text-destructive mt-3">Minimum order: {formatKES(settings.min_order)}</p>
            )}
            <Button type="submit" variant="hero" size="lg" className="w-full mt-4" disabled={submitting || count === 0}>
              {submitting ? "Placing order..." : `Place order · ${formatKES(total)}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Estimated prep: ~{settings?.prep_time_minutes ?? 25} min
            </p>
          </aside>
        </form>
      </section>
    </Layout>
  );
};

export default Checkout;
