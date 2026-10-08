alter table public.promo_campaigns
  add column if not exists promo_code text;

notify pgrst, 'reload schema';
