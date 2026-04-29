-- Core tables expected by NoteAI backend.
-- Apply in Supabase SQL editor and then add RLS policies.

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  meeting_date text,
  meeting_time text,
  duration text,
  source text,
  status text default 'Processing',
  participants text[] default '{}',
  summary_snippet text default '',
  full_transcript text default '',
  action_items jsonb default '[]'::jsonb,
  action_items_count int default 0,
  action_items_completed int default 0,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'Free',
  used_minutes int not null default 0,
  limit_minutes int,
  updated_at timestamptz default now()
);

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  minutes int not null,
  source text not null,
  created_at timestamptz default now()
);

-- Run this block in Supabase SQL editor to support real profile settings.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default '',
  bio text default '',
  avatar_url text default '',
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
