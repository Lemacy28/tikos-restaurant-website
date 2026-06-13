
-- Tighten orders insert policy (remove literal `true`)
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(customer_name)) >= 2
  AND length(btrim(phone)) >= 7
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) > 0
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Restrict trigger function to service_role (triggers still fire automatically)
REVOKE EXECUTE ON FUNCTION public.compute_order_totals() FROM PUBLIC, anon, authenticated;
