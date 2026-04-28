CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE DEFAULT ('TK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfilment TEXT NOT NULL CHECK (fulfilment IN ('delivery', 'pickup')),
  address TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
  notes TEXT,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  delivery_fee INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an order from the public checkout
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies: only the service role (admin edge function) can read

-- Server-side validation
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.customer_name := btrim(NEW.customer_name);
  IF length(NEW.customer_name) < 2 OR length(NEW.customer_name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;

  NEW.phone := btrim(NEW.phone);
  IF length(NEW.phone) < 7 OR length(NEW.phone) > 25 THEN
    RAISE EXCEPTION 'Phone must be between 7 and 25 characters';
  END IF;

  IF NEW.fulfilment = 'delivery' THEN
    IF NEW.address IS NULL OR length(btrim(NEW.address)) < 5 THEN
      RAISE EXCEPTION 'Delivery address is required';
    END IF;
    IF length(NEW.address) > 250 THEN
      RAISE EXCEPTION 'Address is too long';
    END IF;
  END IF;

  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 500 THEN
    RAISE EXCEPTION 'Notes must be 500 characters or fewer';
  END IF;

  IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF jsonb_array_length(NEW.items) > 100 THEN
    RAISE EXCEPTION 'Too many items in order';
  END IF;

  IF NEW.total <> NEW.subtotal + NEW.delivery_fee THEN
    RAISE EXCEPTION 'Total does not match subtotal plus delivery fee';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_order
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order();

CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
