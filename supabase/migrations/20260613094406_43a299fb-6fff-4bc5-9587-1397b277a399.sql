
-- 1. Remove orders from realtime publication (not used in frontend, prevents data leak)
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;

-- 2. Promo codes: drop public select policy, add validation RPC
DROP POLICY IF EXISTS "Anyone validates active code" ON public.promo_codes;

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text, _subtotal integer)
RETURNS TABLE(valid boolean, discount integer, message text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.promo_codes%ROWTYPE;
  d integer := 0;
BEGIN
  SELECT * INTO rec FROM public.promo_codes WHERE upper(code) = upper(btrim(_code)) AND active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Invalid or expired code'::text; RETURN;
  END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN
    RETURN QUERY SELECT false, 0, 'This code has expired'::text; RETURN;
  END IF;
  IF rec.max_uses IS NOT NULL AND rec.used_count >= rec.max_uses THEN
    RETURN QUERY SELECT false, 0, 'This code has reached its usage limit'::text; RETURN;
  END IF;
  IF rec.discount_type = 'percent' THEN
    d := GREATEST(0, ROUND((COALESCE(_subtotal,0)::numeric * rec.discount_value) / 100)::int);
  ELSE
    d := GREATEST(0, rec.discount_value);
  END IF;
  RETURN QUERY SELECT true, d, 'ok'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, integer) TO anon, authenticated;

-- 3. Server-side order total computation trigger
CREATE OR REPLACE FUNCTION public.compute_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it jsonb;
  item_id uuid;
  qty int;
  unit_price int;
  computed_subtotal int := 0;
  computed_fee int := 0;
  computed_discount int := 0;
  rec public.promo_codes%ROWTYPE;
  settings public.business_settings%ROWTYPE;
BEGIN
  -- Recompute subtotal from authoritative menu prices
  FOR it IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    BEGIN
      item_id := (it->>'id')::uuid;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Each order item must include a valid id';
    END;
    qty := COALESCE((it->>'qty')::int, 0);
    IF qty < 1 OR qty > 100 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;
    SELECT price INTO unit_price FROM public.menu_items WHERE id = item_id AND available = true;
    IF unit_price IS NULL THEN
      RAISE EXCEPTION 'Item % is not available', item_id;
    END IF;
    computed_subtotal := computed_subtotal + (unit_price * qty);
  END LOOP;

  -- Delivery fee from settings
  SELECT * INTO settings FROM public.business_settings WHERE id = 1;
  IF NEW.fulfilment = 'delivery' THEN
    computed_fee := COALESCE(settings.delivery_fee, 0);
  ELSE
    computed_fee := 0;
  END IF;

  -- Promo code discount
  IF NEW.promo_code IS NOT NULL AND length(btrim(NEW.promo_code)) > 0 THEN
    SELECT * INTO rec FROM public.promo_codes WHERE upper(code) = upper(btrim(NEW.promo_code)) AND active = true;
    IF FOUND
       AND (rec.expires_at IS NULL OR rec.expires_at >= now())
       AND (rec.max_uses IS NULL OR rec.used_count < rec.max_uses) THEN
      IF rec.discount_type = 'percent' THEN
        computed_discount := GREATEST(0, ROUND((computed_subtotal::numeric * rec.discount_value) / 100)::int);
      ELSE
        computed_discount := GREATEST(0, rec.discount_value);
      END IF;
    ELSE
      NEW.promo_code := NULL;
    END IF;
  END IF;

  NEW.subtotal := computed_subtotal;
  NEW.delivery_fee := computed_fee;
  NEW.discount := computed_discount;
  NEW.total := computed_subtotal + computed_fee - computed_discount;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_order_totals() FROM PUBLIC;

DROP TRIGGER IF EXISTS compute_order_totals_trg ON public.orders;
CREATE TRIGGER compute_order_totals_trg
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.compute_order_totals();

-- 4. mpesa_transactions: explicit admin-only read policy (was implicit deny)
DROP POLICY IF EXISTS "Admins view mpesa transactions" ON public.mpesa_transactions;
CREATE POLICY "Admins view mpesa transactions" ON public.mpesa_transactions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Tighten reservation insert (remove literal `true` check)
DROP POLICY IF EXISTS "Anyone can create a reservation" ON public.reservations;
CREATE POLICY "Anyone can create a reservation" ON public.reservations
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(name)) >= 2
  AND length(btrim(phone)) >= 7
  AND party_size BETWEEN 1 AND 50
  AND reservation_date >= CURRENT_DATE
);

-- 6. Lock down has_role: only callable from within RLS (definer functions can still call it).
-- Authenticated users do not need direct EXECUTE because RLS evaluates policies with table owner rights.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
