-- Fix admin "Cancel signup" — missing cancelled_by on promo_signups
alter table public.promo_signups
  add column if not exists cancelled_by uuid;

notify pgrst, 'reload schema';
