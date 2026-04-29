-- Add plan tier to profiles
alter table public.profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro'));

-- Usage logs: one row per analysis call
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_user_month_idx
  on public.usage_logs (user_id, created_at desc);

alter table public.usage_logs enable row level security;

create policy "usage_logs_select_own" on public.usage_logs
  for select using (auth.uid() = user_id);

create policy "usage_logs_insert_own" on public.usage_logs
  for insert with check (auth.uid() = user_id);
