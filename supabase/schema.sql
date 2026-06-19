-- EngZone cloud sync — run once in Supabase → SQL Editor.
-- One row per (user, localStorage key). RLS so each user only sees their data.

create table if not exists public.app_state (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.app_state enable row level security;

-- A user can read/write only their own rows (auth.uid() = the logged-in user).
drop policy if exists "app_state select own" on public.app_state;
create policy "app_state select own" on public.app_state
  for select using (auth.uid() = user_id);

drop policy if exists "app_state insert own" on public.app_state;
create policy "app_state insert own" on public.app_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "app_state update own" on public.app_state;
create policy "app_state update own" on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "app_state delete own" on public.app_state;
create policy "app_state delete own" on public.app_state
  for delete using (auth.uid() = user_id);
