-- Restate.ai Land Development Studio — Supabase schema
-- Run this in the Supabase SQL Editor after creating your project.

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  generation_count integer not null default 0,
  free_generations_remaining integer not null default 3,
  credit_balance integer not null default 0,
  has_completed_tour boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generations history
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt text not null,
  share_id text not null unique,
  polygon jsonb not null,
  centroid jsonb not null,
  area_acres double precision not null,
  model_url text,
  thumbnail_url text,
  meshy_task_id text,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'completed', 'failed')),
  model_transform jsonb default '{"scale":1,"heading":0,"heightOffset":0}'::jsonb,
  location_name text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generations_user_id_idx on public.generations (user_id);
create index if not exists generations_share_id_idx on public.generations (share_id);
create index if not exists generations_created_at_idx on public.generations (created_at desc);

-- Credit / ad reward ledger (optional audit trail)
create table if not exists public.credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('purchase', 'ad_reward', 'generation_spend', 'admin_grant')),
  amount integer not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists generations_updated_at on public.generations;
create trigger generations_updated_at
  before update on public.generations
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.credit_events enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Generations: owner full access; public read completed by share_id
create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Anyone can view completed shared generations"
  on public.generations for select
  using (status = 'completed');

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own generations"
  on public.generations for update
  using (auth.uid() = user_id);

create policy "Users can delete own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

-- Credit events
create policy "Users can view own credit events"
  on public.credit_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own credit events"
  on public.credit_events for insert
  with check (auth.uid() = user_id);

-- Helper: attempt to consume one generation credit
create or replace function public.consume_generation(p_user_id uuid)
returns table (success boolean, remaining integer, credits integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_free integer;
  v_credits integer;
begin
  select free_generations_remaining, credit_balance
    into v_free, v_credits
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return query select false, 0, 0;
    return;
  end if;

  if v_free > 0 then
    update public.profiles
      set free_generations_remaining = free_generations_remaining - 1,
          generation_count = generation_count + 1
    where id = p_user_id;
    return query select true, v_free - 1, v_credits;
    return;
  end if;

  if v_credits > 0 then
    update public.profiles
      set credit_balance = credit_balance - 1,
          generation_count = generation_count + 1
    where id = p_user_id;
    insert into public.credit_events (user_id, event_type, amount, metadata)
      values (p_user_id, 'generation_spend', -1, '{}'::jsonb);
    return query select true, 0, v_credits - 1;
    return;
  end if;

  return query select false, 0, 0;
end;
$$;

-- Grant +1 free generation after watching ad (rate-limit friendly)
create or replace function public.grant_ad_reward(p_user_id uuid)
returns table (success boolean, free_remaining integer)
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
  v_free integer;
begin
  select count(*) into recent_count
  from public.credit_events
  where user_id = p_user_id
    and event_type = 'ad_reward'
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    select free_generations_remaining into v_free from public.profiles where id = p_user_id;
    return query select false, coalesce(v_free, 0);
    return;
  end if;

  update public.profiles
    set free_generations_remaining = free_generations_remaining + 1
  where id = p_user_id
  returning free_generations_remaining into v_free;

  insert into public.credit_events (user_id, event_type, amount, metadata)
    values (p_user_id, 'ad_reward', 1, jsonb_build_object('source', 'watch_ad'));

  return query select true, v_free;
end;
$$;
