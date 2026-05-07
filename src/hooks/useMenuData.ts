import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DBMenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tag: string | null;
  available: boolean;
  sort_order: number;
};

export type DBCategory = {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  active: boolean;
  items: DBMenuItem[];
};

export const useMenuData = () => {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    const grouped: DBCategory[] = (cats ?? []).map((c) => ({
      ...c,
      items: (items ?? []).filter((i) => i.category_id === c.id),
    }));
    setCategories(grouped);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { categories, loading, reload: load };
};
