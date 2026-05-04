import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-passcode",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expected = Deno.env.get("ADMIN_PASSCODE");
    if (!expected) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provided = req.headers.get("x-admin-passcode") ?? "";
    if (provided.length !== expected.length || provided !== expected) {
      return new Response(JSON.stringify({ error: "Invalid passcode" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") ?? "orders";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (resource === "users") {
      // Combine auth users + profiles
      const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (authErr) {
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone");

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const users = authData.users.map((u) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          provider: u.app_metadata?.provider ?? "email",
          display_name: p?.display_name ?? null,
          phone: p?.phone ?? u.phone ?? null,
        };
      });

      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resource === "reservations") {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, reference, name, phone, email, party_size, reservation_date, reservation_time, notes, created_at")
        .order("reservation_date", { ascending: false })
        .limit(500);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ reservations: data ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resource === "stats") {
      const [ordersC, usersC, resC] = await Promise.all([
        supabase.from("orders").select("id, status, total, created_at"),
        supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
        supabase.from("reservations").select("id", { count: "exact", head: true }),
      ]);
      const orders = ordersC.data ?? [];
      const today = new Date(); today.setHours(0,0,0,0);
      const ordersToday = orders.filter((o) => new Date(o.created_at) >= today).length;
      const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
      const byStatus: Record<string, number> = {};
      orders.forEach((o) => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1; });
      return new Response(JSON.stringify({
        stats: {
          totalOrders: orders.length,
          ordersToday,
          revenue,
          byStatus,
          totalUsers: usersC.data?.total ?? 0,
          totalReservations: resC.count ?? 0,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order status
    if (req.method === "POST" && resource === "update-order") {
      const body = await req.json();
      const { id, status } = body ?? {};
      const allowed = ["new", "preparing", "out_for_delivery", "delivered", "cancelled", "completed"];
      if (!id || !allowed.includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid id or status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: orders
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, reference, customer_name, phone, fulfilment, address, payment_method, notes, items, subtotal, delivery_fee, total, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ orders: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
