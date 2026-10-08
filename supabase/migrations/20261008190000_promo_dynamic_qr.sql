alter table public.promo_campaigns
  add column if not exists qr_short_code text,
  add column if not exists qr_destination_url text;

create unique index if not exists idx_promo_campaigns_qr_short_code
  on public.promo_campaigns (qr_short_code)
  where qr_short_code is not null;

create table if not exists public.promo_qr_scans (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns (id) on delete cascade,
  device_type text not null default 'unknown',
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists promo_qr_scans_campaign_created_idx
  on public.promo_qr_scans (campaign_id, created_at desc);

alter table public.promo_qr_scans enable row level security;
grant all on table public.promo_qr_scans to service_role;
