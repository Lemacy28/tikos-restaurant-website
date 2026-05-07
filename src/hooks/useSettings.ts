import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Settings = {
  id: number;
  open_time: string;
  close_time: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  is_open: boolean;
  delivery_fee: number;
  min_order: number;
  prep_time_minutes: number;
  announcement: string | null;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    setSettings(data as Settings | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, reload: load };
};
