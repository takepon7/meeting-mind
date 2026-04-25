-- MeetingMind AI schema
-- Supabase Auth provides auth.users; profiles extends it with app-specific data.

create extension if not exists "pgcrypto";

-- profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- meetings: raw input submitted by a user
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  raw_text text,
  audio_url text,
  created_at timestamptz not null default now()
);
create index if not exists meetings_user_id_idx on public.meetings(user_id);
create index if not exists meetings_created_at_idx on public.meetings(created_at desc);

-- meeting_results: Claude-generated summary and action items (1:1 with meetings)
create table if not exists public.meeting_results (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings(id) on delete cascade,
  summary text,
  action_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists meeting_results_meeting_id_idx on public.meeting_results(meeting_id);

-- action_items: normalized action items for querying/assignment
create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  assignee text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists action_items_meeting_id_idx on public.action_items(meeting_id);
create index if not exists action_items_status_idx on public.action_items(status);
create index if not exists action_items_due_date_idx on public.action_items(due_date);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_results enable row level security;
alter table public.action_items enable row level security;

-- profiles: user can read/update their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- meetings: owner-only access
create policy "meetings_select_own" on public.meetings
  for select using (auth.uid() = user_id);
create policy "meetings_insert_own" on public.meetings
  for insert with check (auth.uid() = user_id);
create policy "meetings_update_own" on public.meetings
  for update using (auth.uid() = user_id);
create policy "meetings_delete_own" on public.meetings
  for delete using (auth.uid() = user_id);

-- meeting_results: access through parent meeting ownership
create policy "meeting_results_select_own" on public.meeting_results
  for select using (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );
create policy "meeting_results_insert_own" on public.meeting_results
  for insert with check (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );
create policy "meeting_results_update_own" on public.meeting_results
  for update using (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );

-- action_items: access through parent meeting ownership
create policy "action_items_select_own" on public.action_items
  for select using (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );
create policy "action_items_insert_own" on public.action_items
  for insert with check (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );
create policy "action_items_update_own" on public.action_items
  for update using (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );
create policy "action_items_delete_own" on public.action_items
  for delete using (
    exists (select 1 from public.meetings m where m.id = meeting_id and m.user_id = auth.uid())
  );

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
