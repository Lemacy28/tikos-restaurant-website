import { useState } from "react";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const todayISO = () => new Date().toISOString().split("T")[0];

const reservationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(25, "Phone is too long"),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  reservation_date: z.string().refine((d) => d >= todayISO(), "Date cannot be in the past"),
  reservation_time: z.string().min(1, "Time is required"),
  party_size: z.number().int().min(1, "At least 1 guest").max(50, "Max 50 guests"),
  notes: z.string().max(500, "Notes must be 500 characters or fewer").optional(),
});

type Confirmation = {
  reference: string;
  name: string;
  date: string;
  time: string;
  party: number;
};

const Reservations = () => {
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const parsed = reservationSchema.safeParse({
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      reservation_date: String(fd.get("date") ?? ""),
      reservation_time: String(fd.get("time") ?? ""),
      party_size: Number(fd.get("guests") ?? 0),
      notes: String(fd.get("notes") ?? ""),
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check your details");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ? parsed.data.email : null,
        reservation_date: parsed.data.reservation_date,
        reservation_time: parsed.data.reservation_time,
        party_size: parsed.data.party_size,
        notes: parsed.data.notes ? parsed.data.notes : null,
      })
      .select("reference, name, reservation_date, reservation_time, party_size")
      .single();
    setSubmitting(false);

    if (error || !data) {
      toast.error("Could not save reservation", { description: error?.message });
      return;
    }

    form.reset();
    setConfirmation({
      reference: data.reference,
      name: data.name,
      date: data.reservation_date,
      time: data.reservation_time,
      party: data.party_size,
    });
    toast.success("Reservation confirmed!");
  };

  const copyRef = async () => {
    if (!confirmation) return;
    await navigator.clipboard.writeText(confirmation.reference);
    toast.success("Reference copied");
  };

  return (
    <Layout>
      <section className="gradient-hero text-primary-foreground py-16 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Reservations</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Book your table</h1>
          <p className="mt-3 max-w-xl mx-auto text-primary-foreground/90">Reserve in seconds — we'll save your favorite spot.</p>
        </div>
      </section>

      <section className="container mx-auto py-16 max-w-2xl">
        {confirmation ? (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-card text-center">
            <div className="inline-flex p-4 rounded-full gradient-hero text-primary-foreground mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="font-display text-3xl font-bold">You're booked, {confirmation.name.split(" ")[0]}!</h2>
            <p className="text-muted-foreground mt-2">
              {new Date(confirmation.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {confirmation.time.slice(0, 5)} · {confirmation.party} {confirmation.party === 1 ? "guest" : "guests"}
            </p>

            <div className="mt-6 bg-muted rounded-2xl p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Reservation reference</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="font-display text-3xl font-bold text-primary tracking-wider">{confirmation.reference}</div>
                <button onClick={copyRef} aria-label="Copy reference" className="p-2 rounded-full hover:bg-background transition-colors">
                  <Copy size={18} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Show this code when you arrive. We'll call to confirm shortly.</p>
            </div>

            <Button variant="hero" size="lg" className="mt-6" onClick={() => setConfirmation(null)}>
              Make another reservation
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-card border border-border rounded-3xl p-8 shadow-card space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required maxLength={100} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required type="tel" maxLength={25} placeholder="+254 ..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" maxLength={255} placeholder="you@example.com" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" required type="date" min={todayISO()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" name="time" required type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <Input id="guests" name="guests" required type="number" min={1} max={50} defaultValue={2} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special requests</Label>
              <Textarea id="notes" name="notes" maxLength={500} placeholder="Birthday, allergies, seating preference..." rows={3} />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              <CalendarCheck /> {submitting ? "Booking..." : "Confirm Reservation"}
            </Button>
          </form>
        )}
      </section>
    </Layout>
  );
};

export default Reservations;
