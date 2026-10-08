-- Run in Supabase SQL Editor if create campaign fails with:
-- "Could not find the 'campaign_format' column of 'promo_campaigns' in the schema cache"

alter table public.promo_campaigns
  add column if not exists campaign_format text not null default 'guest_list';

alter table public.promo_campaigns
  add column if not exists instagram_username text default 'studio7.rsa';

alter table public.promo_signups
  add column if not exists instagram_handle text;

create unique index if not exists idx_promo_signups_unique_instagram_per_campaign
  on public.promo_signups (campaign_id, lower(instagram_handle))
  where instagram_handle is not null and cancelled_at is null;

grant all on table public.promo_campaigns to service_role;
grant all on table public.promo_signups to service_role;

notify pgrst, 'reload schema';
