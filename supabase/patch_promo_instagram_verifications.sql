-- Instagram follow verification table (run in Supabase SQL Editor)
create table if not exists public.promo_instagram_verifications (
  id uuid primary key default gen_random_uuid(),
  brand_instagram_username text not null,
  instagram_username text not null,
  instagram_scoped_id text,
  follows_business boolean not null default false,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_promo_ig_verifications_brand_user
  on public.promo_instagram_verifications (brand_instagram_username, instagram_username);

alter table public.promo_instagram_verifications enable row level security;
grant all on table public.promo_instagram_verifications to service_role;

notify pgrst, 'reload schema';
