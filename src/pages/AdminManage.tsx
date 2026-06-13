import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, Upload, Star, X, Check, Settings as SettingsIcon, Tag, ImageIcon, UtensilsCrossed, MessageSquare, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

type Cat = { id: string; slug: string; title: string; sort_order: number; active: boolean };
type Item = {
  id: string; category_id: string | null; name: string; description: string | null;
  price: number; image_url: string | null; tag: string | null; available: boolean; sort_order: number;
};
type Promo = {
  id: string; code: string; discount_type: "percent" | "fixed"; discount_value: number;
  active: boolean; expires_at: string | null; max_uses: number | null; used_count: number;
};
type Review = {
  id: string; customer_name: string; rating: number; text: string; approved: boolean; created_at: string;
};

const AdminManage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  if (authLoading || roleLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth?next=/admin/manage" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center">
          <h1 className="font-display text-2xl font-bold">Not authorized</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your account doesn't have admin access. Ask the owner to grant you the admin role.
          </p>
          <Link to="/" className="text-primary text-sm mt-4 inline-block hover:underline">← Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold">Manage Restaurant</h1>
            <p className="text-sm text-muted-foreground">Menu · Settings · Promos · Reviews</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin/orders">Orders dashboard</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/">View site</Link></Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <Tabs defaultValue="menu">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="menu"><UtensilsCrossed size={14} className="mr-1.5" />Menu</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon size={14} className="mr-1.5" />Settings</TabsTrigger>
            <TabsTrigger value="promos"><Tag size={14} className="mr-1.5" />Promos</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare size={14} className="mr-1.5" />Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-6"><MenuManager /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsManager /></TabsContent>
          <TabsContent value="promos" className="mt-6"><PromoManager /></TabsContent>
          <TabsContent value="reviews" className="mt-6"><ReviewsManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/* ---------------- Menu manager ---------------- */
const MenuManager = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [newCat, setNewCat] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    setCats((c ?? []) as Cat[]);
    setItems((i ?? []) as Item[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    const title = newCat.trim();
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("menu_categories").insert({
      title, slug, sort_order: cats.length, active: true,
    });
    if (error) return toast.error(error.message);
    setNewCat(""); toast.success("Category added"); load();
  };
  const toggleCat = async (c: Cat) => {
    await supabase.from("menu_categories").update({ active: !c.active }).eq("id", c.id);
    load();
  };
  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category? Items in it will become uncategorized.")) return;
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const saveItem = async (it: Partial<Item>) => {
    const payload = {
      name: (it.name ?? "").trim(),
      description: it.description?.trim() || null,
      price: Number(it.price) || 0,
      category_id: it.category_id ?? null,
      image_url: it.image_url ?? null,
      tag: it.tag?.trim() || null,
      available: it.available ?? true,
      sort_order: it.sort_order ?? 0,
    };
    if (!payload.name || payload.price <= 0) {
      toast.error("Name and price are required"); return;
    }
    const { error } = it.id
      ? await supabase.from("menu_items").update(payload).eq("id", it.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(it.id ? "Item updated" : "Item added");
    setEditing(null); load();
  };
  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const toggleAvail = async (it: Item) => {
    await supabase.from("menu_items").update({ available: !it.available }).eq("id", it.id);
    load();
  };

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-3">Categories</h2>
        <div className="flex gap-2 mb-4">
          <Input placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={50} />
          <Button onClick={addCategory}><Plus size={16} />Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <div key={c.id} className={`border rounded-full px-3 py-1.5 flex items-center gap-2 text-sm ${c.active ? "bg-primary/5 border-primary/30" : "bg-muted border-border opacity-60"}`}>
              <span className="font-medium">{c.title}</span>
              <button onClick={() => toggleCat(c)} className="text-xs text-muted-foreground hover:text-foreground">
                {c.active ? "hide" : "show"}
              </button>
              <button onClick={() => deleteCat(c.id)} className="text-destructive hover:text-destructive/80"><X size={14} /></button>
            </div>
          ))}
          {cats.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Menu items</h2>
          <Button onClick={() => setEditing({ available: true, sort_order: items.length, category_id: cats[0]?.id })}>
            <Plus size={16} />New item
          </Button>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted grid place-items-center text-muted-foreground"><ImageIcon size={16} /></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{it.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cats.find((c) => c.id === it.category_id)?.title ?? "—"}
                    </TableCell>
                    <TableCell>{formatKES(it.price)}</TableCell>
                    <TableCell>{it.tag ? <Badge variant="outline">{it.tag}</Badge> : "—"}</TableCell>
                    <TableCell><Switch checked={it.available} onCheckedChange={() => toggleAvail(it)} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(it)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem(it.id)} className="text-destructive"><Trash2 size={14} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No items yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ItemDialog
        item={editing}
        cats={cats}
        onClose={() => setEditing(null)}
        onSave={saveItem}
      />
    </div>
  );
};

const ItemDialog = ({
  item, cats, onClose, onSave,
}: {
  item: Partial<Item> | null; cats: Cat[];
  onClose: () => void; onSave: (it: Partial<Item>) => void;
}) => {
  const [draft, setDraft] = useState<Partial<Item>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setDraft(item ?? {}); }, [item]);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setDraft((d) => ({ ...d, image_url: data.publicUrl }));
    setUploading(false);
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{draft.id ? "Edit item" : "New item"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={300} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price (KES)</Label>
              <Input type="number" min={0} value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input value={draft.tag ?? ""} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} placeholder="Spicy, Best seller…" maxLength={30} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={draft.category_id ?? ""}
              onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
            >
              <option value="">— Uncategorized —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-3">
              {draft.image_url && <img src={draft.image_url} className="w-16 h-16 rounded-lg object-cover" alt="" />}
              <label className="cursor-pointer inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 hover:bg-muted">
                <Upload size={14} />{uploading ? "Uploading…" : "Upload image"}
                <input type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
              </label>
              {draft.image_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDraft({ ...draft, image_url: null })}>Remove</Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label className="m-0">Available for ordering</Label>
            <Switch checked={draft.available ?? true} onCheckedChange={(v) => setDraft({ ...draft, available: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}><Save size={14} />Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Settings manager ---------------- */
const SettingsManager = () => {
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("business_settings").select("*").eq("id", 1).maybeSingle()
      .then(({ data }) => setS(data ?? { id: 1 }));
  }, []);

  if (!s) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const update = (patch: Record<string, unknown>) => setS({ ...s, ...patch });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("business_settings").upsert({ ...s, id: 1 });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-semibold">Restaurant open</Label>
          <p className="text-xs text-muted-foreground">Toggle to stop accepting new orders.</p>
        </div>
        <Switch checked={!!s.is_open} onCheckedChange={(v) => update({ is_open: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Open time</Label>
          <Input type="time" value={(s.open_time as string)?.slice(0,5) ?? "10:00"} onChange={(e) => update({ open_time: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Close time</Label>
          <Input type="time" value={(s.close_time as string)?.slice(0,5) ?? "22:00"} onChange={(e) => update({ close_time: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between border border-border rounded-xl p-3">
          <Label>Delivery enabled</Label>
          <Switch checked={!!s.delivery_enabled} onCheckedChange={(v) => update({ delivery_enabled: v })} />
        </div>
        <div className="flex items-center justify-between border border-border rounded-xl p-3">
          <Label>Pickup enabled</Label>
          <Switch checked={!!s.pickup_enabled} onCheckedChange={(v) => update({ pickup_enabled: v })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Delivery fee (KES)</Label>
          <Input type="number" min={0} value={(s.delivery_fee as number) ?? 0} onChange={(e) => update({ delivery_fee: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Min order (KES)</Label>
          <Input type="number" min={0} value={(s.min_order as number) ?? 0} onChange={(e) => update({ min_order: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label>Prep time (min)</Label>
          <Input type="number" min={1} value={(s.prep_time_minutes as number) ?? 25} onChange={(e) => update({ prep_time_minutes: Number(e.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Announcement banner (optional)</Label>
        <Textarea rows={2} maxLength={200} value={(s.announcement as string) ?? ""} onChange={(e) => update({ announcement: e.target.value })}
          placeholder="e.g. Free delivery this weekend!" />
      </div>
      <Button onClick={save} disabled={saving}><Save size={14} />{saving ? "Saving…" : "Save settings"}</Button>
    </div>
  );
};

/* ---------------- Promo codes ---------------- */
const PromoManager = () => {
  const [list, setList] = useState<Promo[]>([]);
  const [draft, setDraft] = useState<Partial<Promo>>({ discount_type: "percent", discount_value: 10, active: true });

  const load = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as Promo[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const code = (draft.code ?? "").trim().toUpperCase();
    if (!code || !draft.discount_value) return toast.error("Code and value required");
    const { error } = await supabase.from("promo_codes").insert({
      code,
      discount_type: draft.discount_type ?? "percent",
      discount_value: Number(draft.discount_value),
      active: draft.active ?? true,
      max_uses: draft.max_uses ? Number(draft.max_uses) : null,
      expires_at: draft.expires_at || null,
    });
    if (error) return toast.error(error.message);
    setDraft({ discount_type: "percent", discount_value: 10, active: true });
    toast.success("Promo code added"); load();
  };
  const toggle = async (p: Promo) => {
    await supabase.from("promo_codes").update({ active: !p.active }).eq("id", p.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-3">New promo code</h2>
        <div className="grid sm:grid-cols-5 gap-3">
          <Input placeholder="CODE" value={draft.code ?? ""} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={draft.discount_type} onChange={(e) => setDraft({ ...draft, discount_type: e.target.value as "percent" | "fixed" })}>
            <option value="percent">% off</option>
            <option value="fixed">KES off</option>
          </select>
          <Input type="number" placeholder="Value" value={draft.discount_value ?? ""} onChange={(e) => setDraft({ ...draft, discount_value: Number(e.target.value) })} />
          <Input type="number" placeholder="Max uses (optional)" value={draft.max_uses ?? ""} onChange={(e) => setDraft({ ...draft, max_uses: Number(e.target.value) || undefined })} />
          <Input type="date" value={draft.expires_at ?? ""} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} />
        </div>
        <Button className="mt-3" onClick={add}><Plus size={14} />Add code</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-bold">{p.code}</TableCell>
                <TableCell>{p.discount_type === "percent" ? `${p.discount_value}%` : formatKES(p.discount_value)}</TableCell>
                <TableCell>{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell><Switch checked={p.active} onCheckedChange={() => toggle(p)} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-destructive"><Trash2 size={14} /></Button>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No promo codes yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/* ---------------- Reviews moderation ---------------- */
const ReviewsManager = () => {
  const [list, setList] = useState<Review[]>([]);
  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as Review[]);
  };
  useEffect(() => { load(); }, []);
  const approve = async (id: string, approved: boolean) => {
    await supabase.from("reviews").update({ approved }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };

  return (
    <div className="grid gap-3">
      {list.map((r) => (
        <article key={r.id} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.customer_name}</span>
                <Badge variant={r.approved ? "default" : "outline"}>{r.approved ? "Published" : "Pending"}</Badge>
              </div>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < r.rating ? "fill-primary text-primary" : "text-muted"} />
                ))}
              </div>
              <p className="mt-2 text-sm">{r.text}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1">
              {r.approved ? (
                <Button size="sm" variant="outline" onClick={() => approve(r.id, false)}><X size={14} />Unpublish</Button>
              ) : (
                <Button size="sm" onClick={() => approve(r.id, true)}><Check size={14} />Approve</Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        </article>
      ))}
      {list.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">No reviews yet.</div>
      )}
    </div>
  );
};

export default AdminManage;
