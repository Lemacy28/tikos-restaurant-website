-- Reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE DEFAULT ('TK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can submit a reservation
CREATE POLICY "Anyone can create a reservation"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No public SELECT/UPDATE/DELETE policies — only service role (staff) can read/manage
