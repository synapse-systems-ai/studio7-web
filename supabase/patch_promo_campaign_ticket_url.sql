alter table public.promo_campaigns
  add column if not exists ticket_url text;

notify pgrst, 'reload schema';
