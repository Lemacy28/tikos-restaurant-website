import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Bike, Store, CheckCircle2, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

const baseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(25, "Phone is too long"),
  notes: z.string().max(300, "Notes must be 300 characters or fewer").optional(),
});

const deliverySchema = baseSchema.extend({
  mode: z.literal("delivery"),
  address: z.string().trim().min(5, "Please enter your delivery address").max(250, "Address is too long"),
});
const pickupSchema = baseSchema.extend({
  mode: z.literal("pickup"),
  address: z.string().optional(),
});
const checkoutSchema = z.discriminatedUnion("mode", [deliverySchema, pickupSchema]);

export type CartItem = { name: string; price: number; qty: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: CartItem[];
  total: number;
  onConfirmed: () => void;
};

const DELIVERY_FEE = 150;

const CheckoutDialog = ({ open, onOpenChange, items, total, onConfirmed }: Props) => {
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    name: string;
    mode: "delivery" | "pickup";
    address?: string;
    grand: number;
  } | null>(null);

  const fee = mode === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = total + fee;

  const reset = () => {
    setMode("delivery");
    setConfirmation(null);
  };

  const close = (v: boolean) => {
    if (!v) {
      if (confirmation) onConfirmed();
      reset();
    }
    onOpenChange(v);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = checkoutSchema.safeParse({
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
    // Simulate order processing
    await new Promise((r) => setTimeout(r, 600));
    const reference =
      "TK-" +
      Math.random().toString(36).slice(2, 8).toUpperCase();
    setSubmitting(false);

    setConfirmation({
      reference,
      name: parsed.data.name,
      mode: parsed.data.mode,
      address: parsed.data.mode === "delivery" ? parsed.data.address : undefined,
      grand: grandTotal,
    });
    toast.success("Order confirmed!");
  };

  const copyRef = async () => {
    if (!confirmation) return;
    await navigator.clipboard.writeText(confirmation.reference);
    toast.success("Reference copied");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {confirmation ? (
          <div className="text-center py-2">
            <div className="inline-flex p-4 rounded-full gradient-hero text-primary-foreground mb-3">
              <CheckCircle2 size={28} />
            </div>
            <DialogTitle className="font-display text-2xl">Thanks, {confirmation.name.split(" ")[0]}!</DialogTitle>
            <DialogDescription className="mt-1">
              Your {confirmation.mode === "delivery" ? "delivery" : "pickup"} order is confirmed. We'll call to confirm shortly.
            </DialogDescription>

            <div className="mt-5 bg-muted rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Order reference</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="font-display text-2xl font-bold text-primary tracking-wider">{confirmation.reference}</div>
                <button onClick={copyRef} aria-label="Copy reference" className="p-2 rounded-full hover:bg-background transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-left bg-card border border-border rounded-2xl p-4 space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium capitalize">{confirmation.mode}</span></div>
              {confirmation.address && (
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Address</span><span className="font-medium text-right">{confirmation.address}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="font-display font-semibold">Total paid on arrival</span><span className="font-display font-bold text-primary">{formatKES(confirmation.grand)}</span></div>
            </div>

            <Button variant="hero" size="lg" className="w-full mt-5" onClick={() => close(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Checkout</DialogTitle>
              <DialogDescription>Just a few details and your order is on its way.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Mode toggle */}
              <div>
                <Label className="mb-2 block">How would you like it?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "delivery", label: "Delivery", icon: Bike },
                    { value: "pickup", label: "Pickup", icon: Store },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMode(opt.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border-2 p-3 font-medium transition-all",
                        mode === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <opt.icon size={18} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="co-name">Full name</Label>
                  <Input id="co-name" name="name" required maxLength={100} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="co-phone">Phone</Label>
                  <Input id="co-phone" name="phone" required type="tel" maxLength={25} placeholder="+254 ..." />
                </div>
              </div>

              {mode === "delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="co-address">Delivery address</Label>
                  <Textarea id="co-address" name="address" required maxLength={250} rows={2} placeholder="Estate, street, house/apartment, landmark" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="co-notes">Notes (optional)</Label>
                <Textarea id="co-notes" name="notes" maxLength={300} rows={2} placeholder="Allergies, preferences, gate code..." />
              </div>

              {/* Summary */}
              <div className="bg-muted rounded-2xl p-4 space-y-1.5 text-sm">
                <div className="font-display font-semibold mb-1">Order summary</div>
                <ul className="space-y-1">
                  {items.map((i) => (
                    <li key={i.name} className="flex justify-between gap-3">
                      <span className="truncate">{i.qty}× {i.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{formatKES(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between pt-2 border-t border-border mt-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatKES(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{mode === "delivery" ? "Delivery fee" : "Pickup"}</span>
                  <span>{mode === "delivery" ? formatKES(DELIVERY_FEE) : "Free"}</span>
                </div>
                <div className="flex justify-between font-display text-base font-bold pt-1">
                  <span>Total</span>
                  <span className="text-primary">{formatKES(grandTotal)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-5">
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting || items.length === 0}>
                {submitting ? "Placing order..." : `Place order · ${formatKES(grandTotal)}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
