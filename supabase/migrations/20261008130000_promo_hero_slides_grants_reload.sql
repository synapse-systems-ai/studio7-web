-- Run this if the table exists but the gallery still says setup failed / import errors.
grant all on table public.promo_hero_slides to service_role;
grant all on table public.promo_hero_slides to postgres;

notify pgrst, 'reload schema';
