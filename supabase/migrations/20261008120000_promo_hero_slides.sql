-- Rotating promo landing backgrounds (Studio 7 fading hero gallery)
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

alter table public.promo_hero_slides enable row level security;

-- Server routes use the service role key (bypasses RLS).
grant all on table public.promo_hero_slides to service_role;
grant all on table public.promo_hero_slides to postgres;

-- Refresh PostgREST so the API sees the new table immediately.
notify pgrst, 'reload schema';
