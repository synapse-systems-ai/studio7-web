-- Studio 7 promo QR: core tables (run this FIRST if promo_campaigns does not exist).
-- Use the same Supabase project as NEXT_PUBLIC_SUPABASE_URL in Vercel / .env.local.

-- Optional: guest-list signups link to customers when email/phone match.
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text,
  is_active boolean not null default true,
  total_spent numeric not null default 0,
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  brand text not null default 'studio7',
  headline text,
  description text,
  image_url text,
  discount_percent integer not null default 10,
  terms_text text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  code_valid_hours integer default 24,
  campaign_format text not null default 'guest_list',
  instagram_username text default 'studio7.rsa',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_campaigns_slug_key unique (slug)
);

create index if not exists promo_campaigns_brand_idx on public.promo_campaigns (brand);

create table if not exists public.promo_signups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  name text,
  email text not null,
  phone text,
  instagram_handle text,
  contact_method text default 'email',
  discount_code text not null,
  access_token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint promo_signups_access_token_key unique (access_token)
);

create unique index if not exists idx_promo_signups_unique_email_per_campaign
  on public.promo_signups (campaign_id, lower(email))
  where cancelled_at is null;

create unique index if not exists idx_promo_signups_unique_instagram_per_campaign
  on public.promo_signups (campaign_id, lower(instagram_handle))
  where instagram_handle is not null and cancelled_at is null;

create index if not exists promo_signups_campaign_id_idx on public.promo_signups (campaign_id);

create table if not exists public.promo_campaign_views (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns (id) on delete cascade,
  device_id text,
  created_at timestamptz not null default now()
);

create index if not exists promo_campaign_views_campaign_id_idx on public.promo_campaign_views (campaign_id);

create table if not exists public.promo_hero_slides (
  id uuid primary key default gen_random_uuid(),
  brand text not null default 'studio7',
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists promo_hero_slides_brand_sort_idx
  on public.promo_hero_slides (brand, sort_order, created_at);

alter table public.promo_campaigns enable row level security;
alter table public.promo_signups enable row level security;
alter table public.promo_campaign_views enable row level security;
alter table public.promo_hero_slides enable row level security;
alter table public.customers enable row level security;

-- App uses service role on the server only.
grant all on table public.promo_campaigns to service_role;
grant all on table public.promo_signups to service_role;
grant all on table public.promo_campaign_views to service_role;
grant all on table public.promo_hero_slides to service_role;
grant all on table public.customers to service_role;

notify pgrst, 'reload schema';
