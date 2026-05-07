
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Menu categories
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active categories" ON public.menu_categories FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.menu_categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Menu items
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL CHECK (price >= 0),
  image_url text,
  tag text,
  available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads available items" ON public.menu_items FOR SELECT USING (available OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage items" ON public.menu_items FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business settings (single row)
CREATE TABLE public.business_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  open_time time NOT NULL DEFAULT '10:00',
  close_time time NOT NULL DEFAULT '22:00',
  delivery_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  is_open boolean NOT NULL DEFAULT true,
  delivery_fee integer NOT NULL DEFAULT 150,
  min_order integer NOT NULL DEFAULT 0,
  prep_time_minutes int NOT NULL DEFAULT 25,
  announcement text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.business_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.business_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert settings" ON public.business_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.business_settings (id) VALUES (1);

-- Promo codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone validates active code" ON public.promo_codes FOR SELECT USING (active);
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads approved reviews" ON public.reviews FOR SELECT USING (approved OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users post reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders: add discount + allow admin updates and reads
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code text;

CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reservations: allow admin reads
CREATE POLICY "Admins view reservations" ON public.reservations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Update validate_order to allow discount
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
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
    IF length(NEW.address) > 250 THEN RAISE EXCEPTION 'Address is too long'; END IF;
  END IF;
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 500 THEN
    RAISE EXCEPTION 'Notes must be 500 characters or fewer';
  END IF;
  IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  IF jsonb_array_length(NEW.items) > 100 THEN RAISE EXCEPTION 'Too many items in order'; END IF;
  IF NEW.total <> NEW.subtotal + NEW.delivery_fee - COALESCE(NEW.discount, 0) THEN
    RAISE EXCEPTION 'Total mismatch';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS validate_order_trigger ON public.orders;
CREATE TRIGGER validate_order_trigger BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Admins write menu images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update menu images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete menu images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');
CREATE POLICY "Admins write gallery" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update gallery" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete gallery" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed menu from existing data
INSERT INTO public.menu_categories (slug, title, sort_order) VALUES
  ('chicken','Signature Chicken',1),
  ('burgers','Burgers & Wraps',2),
  ('sides','Sides',3),
  ('drinks','Drinks',4),
  ('desserts','Desserts',5);

INSERT INTO public.menu_items (category_id, name, description, price, tag, sort_order)
SELECT c.id, x.name, x.description, x.price, x.tag, x.so FROM (VALUES
  ('chicken','Tikos Crispy Bucket (8pc)','Our legendary hand-breaded chicken with secret spice blend.',1450,'Bestseller',1),
  ('chicken','Quarter Chicken & Chips','Crispy quarter chicken, golden fries, house dip.',650,NULL,2),
  ('chicken','Half Chicken Platter','Half chicken, two sides, kachumbari.',1100,NULL,3),
  ('chicken','Spicy Fire Wings (6pc)','Tossed in our signature scotch bonnet glaze.',550,'Spicy',4),
  ('burgers','Tikos Big Chick Burger','Double crispy fillet, cheddar, lettuce, special sauce.',720,'New',1),
  ('burgers','Smoky BBQ Chicken Wrap','Grilled chicken, smoked BBQ, slaw in a soft tortilla.',580,NULL,2),
  ('burgers','Classic Beef Burger','Juicy beef patty, cheese, caramelised onions.',690,NULL,3),
  ('sides','Crispy Fries','Golden, salted, seasoned.',250,NULL,1),
  ('sides','Loaded Cheesy Fries','Fries, cheese sauce, jalapeños, herbs.',420,NULL,2),
  ('sides','Coleslaw','Creamy, crunchy, cooling.',180,NULL,3),
  ('sides','Ugali','Fresh, hot.',100,NULL,4),
  ('drinks','Fresh Passion Juice','Locally sourced, no added sugar.',220,NULL,1),
  ('drinks','Tikos Strawberry Mojito (Mocktail)','Strawberry, mint, lime, soda.',350,NULL,2),
  ('drinks','Iced Dawa','Honey, lemon, ginger over ice.',280,NULL,3),
  ('drinks','Soft Drink (500ml)','Coke, Fanta, Sprite, Stoney.',120,NULL,4),
  ('drinks','Tusker Lager','Ice-cold Kenyan classic.',280,NULL,5),
  ('desserts','Molten Chocolate Cake','Warm chocolate cake with vanilla ice cream.',380,NULL,1),
  ('desserts','Mandazi & Honey','Fluffy mandazi served with wild honey.',220,NULL,2)
) x(slug, name, description, price, tag, so)
JOIN public.menu_categories c ON c.slug = x.slug;
