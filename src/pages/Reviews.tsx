import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Send, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  text: string;
  created_at: string;
}

const ReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, text: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, customer_name, rating, text, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }
    const name = form.name.trim();
    const text = form.text.trim();
    if (!name || !text) {
      toast.error("Name and review text are required");
      return;
    }
    if (text.length < 5) {
      toast.error("Review must be at least 5 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      customer_name: name,
      rating: form.rating,
      text,
      approved: false,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review submitted! It will appear after approval.");
    setForm({ name: "", rating: 5, text: "" });
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <Layout>
      {/* Hero */}
      <section className="gradient-hero text-primary-foreground py-14 text-center">
        <div className="container mx-auto">
          <span className="uppercase tracking-widest text-sm text-primary-foreground/80">Reviews</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mt-2">Loved by Kitengela</h1>
          <p className="mt-3 max-w-xl mx-auto text-primary-foreground/90">
            Real stories from real guests. Share your Tikos experience with us.
          </p>
          {!loading && reviews.length > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium">
              <Star size={16} className="fill-secondary text-secondary" />
              {avgRating} out of 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto py-12 grid lg:grid-cols-3 gap-8">
        {/* Review list */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} /> Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="font-display font-semibold">{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < r.rating ? "fill-secondary text-secondary" : "text-muted-foreground/40"}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-foreground/90 leading-relaxed">{r.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Submit form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card sticky top-24">
            <h2 className="font-display text-xl font-bold mb-1">Write a review</h2>
            <p className="text-sm text-muted-foreground mb-5">Share your Tikos experience with others.</p>

            {user ? (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rev-name">Your name</Label>
                  <Input
                    id="rev-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    maxLength={100}
                    placeholder="e.g. Wanjiku M."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))}
                        className="p-1"
                        aria-label={`Rate ${i + 1} stars`}
                      >
                        <Star
                          size={24}
                          className={i < form.rating ? "fill-secondary text-secondary" : "text-muted-foreground/40"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rev-text">Your review</Label>
                  <Textarea
                    id="rev-text"
                    rows={4}
                    value={form.text}
                    onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                    maxLength={500}
                    placeholder="What did you love?"
                  />
                  <div className="text-xs text-muted-foreground text-right">{form.text.length}/500</div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Submitting…</> : <><Send size={16} className="mr-2" /> Submit review</>}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Sign in to leave a review.</p>
                <Button asChild variant="hero" className="w-full">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReviewsPage;
