-- Upgrade existing promo_campaigns (skip if you ran 20261007000000_studio7_promo_core.sql — columns already included).

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'promo_campaigns'
  ) then
    alter table public.promo_campaigns
      add column if not exists campaign_format text not null default 'guest_list';
    alter table public.promo_campaigns
      add column if not exists instagram_username text default 'studio7.rsa';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'promo_signups'
  ) then
    alter table public.promo_signups
      add column if not exists instagram_handle text;
  end if;
end $$;

create unique index if not exists idx_promo_signups_unique_instagram_per_campaign
  on public.promo_signups (campaign_id, lower(instagram_handle))
  where instagram_handle is not null and cancelled_at is null;

notify pgrst, 'reload schema';
