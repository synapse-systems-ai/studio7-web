-- Admin / marketing sign-in (JWT auth, not Supabase Auth)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  password_hash text not null,
  role text not null default 'marketing',
  phone text,
  store_id uuid,
  is_active boolean not null default true,
  force_password_change boolean not null default false,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_key unique (email)
);

create index if not exists users_role_idx on public.users (role);

alter table public.users enable row level security;
grant all on table public.users to service_role;

notify pgrst, 'reload schema';
