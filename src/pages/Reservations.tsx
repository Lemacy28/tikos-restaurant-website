import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";

const Reservations = () => {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Reservation request received!", {
        description: "We'll call to confirm shortly. Asante sana!",
      });
    }, 700);
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
        <form onSubmit={onSubmit} className="bg-card border border-border rounded-3xl p-8 shadow-card space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" required type="tel" placeholder="+254 ..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" required type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" required type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Guests</Label>
              <Input id="guests" required type="number" min={1} max={20} defaultValue={2} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Special requests</Label>
            <Textarea id="notes" placeholder="Birthday, allergies, seating preference..." rows={3} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            <CalendarCheck /> {submitting ? "Sending..." : "Request Reservation"}
          </Button>
        </form>
      </section>
    </Layout>
  );
};

export default Reservations;
