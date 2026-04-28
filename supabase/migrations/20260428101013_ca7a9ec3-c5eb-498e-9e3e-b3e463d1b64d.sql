CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Trim and validate name
  NEW.name := btrim(NEW.name);
  IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;

  -- Validate phone
  NEW.phone := btrim(NEW.phone);
  IF length(NEW.phone) < 7 OR length(NEW.phone) > 25 THEN
    RAISE EXCEPTION 'Phone must be between 7 and 25 characters';
  END IF;

  -- Optional email length cap
  IF NEW.email IS NOT NULL AND length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email is too long';
  END IF;

  -- Notes length cap
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 500 THEN
    RAISE EXCEPTION 'Notes must be 500 characters or fewer';
  END IF;

  -- Reservation date must be today or in the future
  IF NEW.reservation_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Reservation date cannot be in the past';
  END IF;

  -- Party size already constrained, but double-check
  IF NEW.party_size < 1 OR NEW.party_size > 50 THEN
    RAISE EXCEPTION 'Party size must be between 1 and 50';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_reservation
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.validate_reservation();
